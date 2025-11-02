import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import cardsColor from '../../seeds/cards.color.json'
import cardsBlack from '../../seeds/cards.black.json'
import emotions from '../../seeds/emotions.json'
import { mulberry32, seedFromString } from '../utils/prng'

export type Mode = 'virtual' | 'inperson'
export type Asset = 'equity' | 'debt' | 'gold' | 'cash'
export type Emotion = 'Confidence'|'Discipline'|'Patience'|'Conviction'|'Adaptability'
export type UiPhase = 'setup' | 'roundStart' | 'teamInputs' | 'postColor' | 'postBlack' | 'end'

export interface Allocation { equity: number; debt: number; gold: number; cash: number }
export interface Team { id: string; name: string; nav: number; allocation: Allocation }
export interface Submission {
  teamId: string
  allocationBefore: Allocation
  allocationAfter: Allocation
  emotion: Emotion
  pitchScore: number
  emotionScore: number
  portfolioReturn: number
  navAfter: number
}
export interface Round {
  id: string
  index: number
  colorCardCode: string | null
  blackCardCode: string | null
  submissions: Submission[]
  snapshotBefore: {
    teams: Array<{ teamId: string; nav: number; allocation: Allocation }>
    deckCursor: number
  }
  startedAt: string
  endedAt?: string
}
export interface GameState {
  mode: Mode
  settings: {
    changeCapPct: number
    allowReshuffle: boolean
    seed: string
  }
  teams: Team[]
  rounds: Round[]
  deck: { colorOrder: string[]; blackOrder: string[]; cursorColor: number; cursorBlack: number }
  startedAt: string
  endedAt?: string
  schema_version: number
  uiPhase: UiPhase
}
export interface Card {
  code: string
  title: string
  text: string
  image_path?: string
  overlayMode?: 'add'|'multiply'
  marketImpact: Partial<Record<Asset, number>>
}

function id(prefix='id'){ return prefix+'_'+Math.random().toString(36).slice(2,9) }
function now(){ return new Date().toISOString() }
function defaultAlloc(): Allocation { return { equity:25, debt:25, gold:25, cash:25 } }

/** Compute portfolio return given allocation and cards (color + optional black overlay) */
function computePortfolioReturn(
  alloc: Allocation,
  color: Card,
  black?: Card
) {
  const base: Record<Asset, number> = {
    equity: 0, debt: 0, gold: 0, cash: 0,
    ...(color.marketImpact as any),
  };

  if (black) {
    if (black.overlayMode === 'multiply') {
      (['equity','debt','gold','cash'] as Asset[]).forEach((k) => {
        const overlay = ((black.marketImpact as any)[k] ?? 0) as number;
        base[k] = (base[k] ?? 0) * (1 + overlay);
      });
    } else {
      (['equity','debt','gold','cash'] as Asset[]).forEach((k) => {
        const add = ((black.marketImpact as any)[k] ?? 0) as number;
        base[k] = (base[k] ?? 0) + add;
      });
    }
  }

  return (
    (alloc.equity * (base.equity ?? 0) +
     alloc.debt   * (base.debt   ?? 0) +
     alloc.gold   * (base.gold   ?? 0) +
     alloc.cash   * (base.cash   ?? 0)) / 100
  );
}

type Store = {
  state: GameState | null
  hydrated: boolean
  emotions: { name: Emotion, icon: string }[]
  cardsColor: Card[]
  cardsBlack: Card[]
  newGame: (mode: Mode, seed?: string) => void
  addTeam: (name: string) => void
  removeTeam: (id: string) => void
  startRound: () => void
  setPhase: (p: UiPhase) => void
  goNextRound: () => void
  selectColorCard: (code: string) => void
  drawColorCard: () => void
  selectBlackCard: (code: string) => void
  drawBlackCard: () => void
  submitTeam: (teamId: string, allocationAfter: Allocation, emotion: Emotion, pitch: number, emotionScore: number) => void
  applyResults: () => void
  applyBlackResults: () => void
  undoRound: () => void
  rescoreRound: () => void
  endGame: () => void
}

const useGame = create<Store>()(
  persist<Store>(
    (set, get) => ({
      state: null,
      hydrated: false,
      emotions: emotions as any,
      cardsColor: cardsColor as any,
      cardsBlack: cardsBlack as any,

      newGame: (mode, seedStr) => {
        const seed = seedStr || Math.random().toString(36).slice(2)
        const rnd = mulberry32(seedFromString(seed))
        const colorOrder = [...(cardsColor as any)].map((c:any)=>c.code).sort(()=>rnd()-0.5)
        const blackOrder = [...(cardsBlack as any)].map((c:any)=>c.code).sort(()=>rnd()-0.5)
        set({
          state: {
            mode,
            settings: { changeCapPct: 20, allowReshuffle: false, seed },
            teams: [],
            rounds: [],
            deck: { colorOrder, blackOrder, cursorColor: 0, cursorBlack: 0 },
            startedAt: now(),
            schema_version: 2,
            uiPhase: 'setup',
          }
        })
      },

      addTeam: (name) => set((s) => {
        const st = s.state; if (!st) return s
        const team: Team = { id: id('team'), name, nav: 10.0, allocation: defaultAlloc() }
        return { state: { ...st, teams: [...st.teams, team] } }
      }),

      removeTeam: (tid) => set((s) => {
        const st = s.state; if (!st) return s
        return { state: { ...st, teams: st.teams.filter(t=>t.id!==tid) } }
      }),

      startRound: () => set((s) => {
        const st = s.state; if (!st) return s
        const r: Round = {
          id: id('rnd'),
          index: st.rounds.length,
          colorCardCode: null,
          blackCardCode: null,
          submissions: [],
          snapshotBefore: {
            teams: st.teams.map(t => ({ teamId: t.id, nav: t.nav, allocation: { ...t.allocation } })),
            deckCursor: st.deck.cursorColor
          },
          startedAt: now()
        }
        return { state: { ...st, rounds: [...st.rounds, r], uiPhase: 'roundStart' } }
      }),

      setPhase: (p) => set((s) => {
        const st = s.state; if (!st) return s
        return { state: { ...st, uiPhase: p } }
      }),

      goNextRound: () => set((s) => {
        const st = s.state; if (!st) return s
        const r: Round = {
          id: id('rnd'),
          index: st.rounds.length,
          colorCardCode: null,
          blackCardCode: null,
          submissions: [],
          snapshotBefore: {
            teams: st.teams.map(t => ({ teamId: t.id, nav: t.nav, allocation: { ...t.allocation } })),
            deckCursor: st.deck.cursorColor
          },
          startedAt: now()
        }
        return { state: { ...st, rounds: [...st.rounds, r], uiPhase: 'roundStart' } }
      }),

      selectColorCard: (code) => set((s) => {
        const st = s.state; if (!st) return s
        const rounds = [...st.rounds]
        const r = rounds[rounds.length-1]; if (!r) return s
        r.colorCardCode = code
        return { state: { ...st, rounds, uiPhase: 'teamInputs' } }
      }),

      drawColorCard: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s
        if (st.deck.cursorColor >= st.deck.colorOrder.length && !st.settings.allowReshuffle) return s
        if (st.deck.cursorColor >= st.deck.colorOrder.length) st.deck.cursorColor = 0
        r.colorCardCode = st.deck.colorOrder[st.deck.cursorColor++]
        return { state: { ...st, uiPhase: 'teamInputs' } }
      }),

      selectBlackCard: (code) => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s
        r.blackCardCode = code
        return { state: { ...st } }
      }),

      drawBlackCard: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s
        if (st.deck.cursorBlack >= st.deck.blackOrder.length && !st.settings.allowReshuffle) return s
        if (st.deck.cursorBlack >= st.deck.blackOrder.length) st.deck.cursorBlack = 0
        r.blackCardCode = st.deck.blackOrder[st.deck.cursorBlack++]
        return { state: { ...st } }
      }),

      submitTeam: (teamId, allocationAfter, emotion, pitch, emotionScore) => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s

        // validations
        const sum = allocationAfter.equity + allocationAfter.debt + allocationAfter.gold + allocationAfter.cash
        if (Math.abs(sum - 100) > 0.001) return s
        const team = st.teams.find(t=>t.id===teamId)
        if (!team) return s
        const cap = st.settings.changeCapPct
        const shift = Math.abs(allocationAfter.equity - team.allocation.equity)
          + Math.abs(allocationAfter.debt - team.allocation.debt)
          + Math.abs(allocationAfter.gold - team.allocation.gold)
          + Math.abs(allocationAfter.cash - team.allocation.cash)
        if (shift > cap) return s

        const subIndex = r.submissions.findIndex(x=>x.teamId===teamId)
        const allocationBefore = { ...team.allocation }
        const sub: Submission = {
          teamId,
          allocationBefore,
          allocationAfter,
          emotion,
          pitchScore: pitch,
          emotionScore,
          portfolioReturn: 0,
          navAfter: team.nav
        }
        if (subIndex >= 0) r.submissions[subIndex] = sub
        else r.submissions.push(sub)
        return { state: { ...st } }
      }),

      applyResults: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r || !r.colorCardCode) return s
        const color = (s.cardsColor as unknown as Card[]).find(c=>c.code===r.colorCardCode)
        if (!color) return s

        // Note: black is NOT applied here; it's applied separately in applyBlackResults (as per game flow)
        for (const sub of r.submissions){
          const t = st.teams.find(x=>x.id===sub.teamId)!
          const pr = computePortfolioReturn(sub.allocationAfter, color)
          sub.portfolioReturn = pr
          sub.navAfter = t.nav * (1 + pr) + sub.pitchScore + sub.emotionScore
          // persist to team
          t.allocation = { ...sub.allocationAfter }
          t.nav = sub.navAfter
        }
        r.endedAt = now()
        return { state: { ...st, uiPhase: 'postColor' } }
      }),

      applyBlackResults: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r || !r.blackCardCode) return s
        const black = (s.cardsBlack as any as Card[]).find(x=>x.code===r.blackCardCode)
        if (!black) return s

        for (const sub of r.submissions){
          const t = st.teams.find(x=>x.id===sub.teamId)!
          // apply black impact on current allocation AFTER color NAV applied
          const pr =
            ((black.marketImpact?.equity ?? 0) * sub.allocationAfter.equity +
             (black.marketImpact?.debt   ?? 0) * sub.allocationAfter.debt +
             (black.marketImpact?.gold   ?? 0) * sub.allocationAfter.gold +
             (black.marketImpact?.cash   ?? 0) * sub.allocationAfter.cash) / 100
          t.nav = t.nav * (1 + pr)
          sub.navAfter = t.nav
          sub.portfolioReturn = sub.portfolioReturn + pr
        }
        return { state: { ...st, uiPhase: 'postBlack' } }
      }),

      undoRound: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s
        // restore snapshot
        for (const snap of r.snapshotBefore.teams){
          const t = st.teams.find(x=>x.id===snap.teamId)!
          t.nav = snap.nav
          t.allocation = { ...snap.allocation }
        }
        st.deck.cursorColor = r.snapshotBefore.deckCursor
        // remove the round
        const rounds = st.rounds.slice(0, -1)
        return { state: { ...st, rounds, uiPhase: rounds.length ? 'postBlack' : 'setup' } }
      }),

      rescoreRound: () => set((s) => {
        const st = s.state; if (!st) return s
        const r = st.rounds[st.rounds.length-1]; if (!r) return s
        if (!r.colorCardCode) return s
        const color = (s.cardsColor as unknown as Card[]).find(c=>c.code===r.colorCardCode)
        if (!color) return s

        // restore snapshot first
        for (const snap of r.snapshotBefore.teams){
          const t = st.teams.find(x=>x.id===snap.teamId)!
          t.nav = snap.nav
          t.allocation = { ...snap.allocation }
        }

        // re-apply color
        for (const sub of r.submissions){
          const t = st.teams.find(x=>x.id===sub.teamId)!
          const pr = computePortfolioReturn(sub.allocationAfter, color)
          sub.portfolioReturn = pr
          sub.navAfter = t.nav * (1 + pr) + sub.pitchScore + sub.emotionScore
          t.allocation = { ...sub.allocationAfter }
          t.nav = sub.navAfter
        }

        // re-apply black if present
        if (r.blackCardCode) {
          const black = (s.cardsBlack as any as Card[]).find(x=>x.code===r.blackCardCode)
          if (black) {
            for (const sub of r.submissions){
              const t = st.teams.find(x=>x.id===sub.teamId)!
              const pr =
                ((black.marketImpact?.equity ?? 0) * sub.allocationAfter.equity +
                 (black.marketImpact?.debt   ?? 0) * sub.allocationAfter.debt +
                 (black.marketImpact?.gold   ?? 0) * sub.allocationAfter.gold +
                 (black.marketImpact?.cash   ?? 0) * sub.allocationAfter.cash) / 100
              t.nav = t.nav * (1 + pr)
              sub.navAfter = t.nav
              sub.portfolioReturn = sub.portfolioReturn + pr
            }
          }
        }

        r.endedAt = now()
        return { state: { ...st } }
      }),

      endGame: () => set((s) => {
        const st = s.state; if (!st) return s
        return { state: { ...st, endedAt: now(), uiPhase: 'end' } }
      }),
    }),
    {
      name: 'cyclesense:game:v2',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: any) => {
        // Ensure uiPhase exists on old saves
        if (persisted && persisted.state && !persisted.state.uiPhase) {
          persisted.state.uiPhase = 'setup'
        }
        // Normalize timestamps to strings if needed
        if (persisted?.state?.startedAt && typeof persisted.state.startedAt !== 'string') {
          persisted.state.startedAt = new Date(persisted.state.startedAt).toISOString()
        }
        if (persisted?.state?.endedAt && typeof persisted.state.endedAt !== 'string') {
          persisted.state.endedAt = new Date(persisted.state.endedAt).toISOString()
        }
        return persisted
      },
    }
  )
)

export default useGame
