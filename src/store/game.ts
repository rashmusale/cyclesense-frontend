
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import cardsColor from '../../seeds/cards.color.json'
import cardsBlack from '../../seeds/cards.black.json'
import emotions from '../../seeds/emotions.json'
import { mulberry32, seedFromString } from '../utils/prng'

export type Mode = 'virtual' | 'inperson'
export type Asset = 'equity' | 'debt' | 'gold' | 'cash'
export type Emotion = 'Confidence'|'Discipline'|'Patience'|'Conviction'|'Adaptability'

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

function computePortfolioReturn(alloc: Allocation, color: Card, black?: Card){
  const base = { equity:0, debt:0, gold:0, cash:0, ...color.marketImpact } as any
  if (black){
    if (black.overlayMode === 'multiply') {
      for (const k of ['equity','debt','gold','cash']){
        base[k] = (base[k] ?? 0) * (1 + (black.marketImpact as any)[k] ?? 0)
      }
    } else { // add (default)
      for (const k of ['equity','debt','gold','cash']){
        base[k] = (base[k] ?? 0) + ((black.marketImpact as any)[k] ?? 0)
      }
    }
  }
  return (alloc.equity*base.equity + alloc.debt*base.debt + alloc.gold*base.gold + alloc.cash*base.cash)/100
}

const useGame = create(persist<{
  state: GameState | null
  emotions: { name: Emotion, icon: string }[]
  cardsColor: Card[]
  cardsBlack: Card[]
  newGame: (mode: Mode, seed?: string) => void
  addTeam: (name: string) => void
  removeTeam: (id: string) => void
  startRound: () => void
  selectColorCard: (code: string) => void
  drawColorCard: () => void
  selectBlackCard: (code: string) => void
  drawBlackCard: () => void
  submitTeam: (teamId: string, allocationAfter: Allocation, emotion: Emotion, pitch: number, emotionScore: number) => void
  applyResults: () => void
  undoRound: () => void
  rescoreRound: () => void
  endGame: () => void
}>(
  (set, get) => ({
    state: null,
    emotions: emotions as any,
    cardsColor: cardsColor as any,
    cardsBlack: cardsBlack as any,

    newGame: (mode, seedStr) => {
      const seed = seedStr || Math.random().toString(36).slice(2)
      const rnd = mulberry32(seedFromString(seed))
      const colorOrder = [...(cardsColor as any)].map((c:any)=>c.code).sort(()=>rnd()-0.5)
      const blackOrder = [...(cardsBlack as any)].map((c:any)=>c.code).sort(()=>rnd()-0.5)
      set({ state: {
        mode,
        settings: { changeCapPct: 20, allowReshuffle: false, seed },
        teams: [],
        rounds: [],
        deck: { colorOrder, blackOrder, cursorColor: 0, cursorBlack: 0 },
        startedAt: now(),
        schema_version: 1
      }})
    },

    addTeam: (name) => set(s => {
      if (!s.state) return s
      const team: Team = { id: id('team'), name, nav: 10.0, allocation: defaultAlloc() }
      return { state: { ...s.state, teams: [...s.state.teams, team] } }
    }),
    removeTeam: (tid) => set(s => {
      if (!s.state) return s
      return { state: { ...s.state, teams: s.state.teams.filter(t=>t.id!==tid) } }
    }),

    startRound: () => set(s => {
      if (!s.state) return s
      const r: Round = {
        id: id('rnd'),
        index: s.state.rounds.length,
        colorCardCode: null,
        blackCardCode: null,
        submissions: [],
        snapshotBefore: {
          teams: s.state.teams.map(t => ({ teamId: t.id, nav: t.nav, allocation: { ...t.allocation } })),
          deckCursor: s.state.deck.cursorColor
        },
        startedAt: now()
      }
      return { state: { ...s.state, rounds: [...s.state.rounds, r] } }
    }),

    selectColorCard: (code) => set(s => {
      const st = s.state; if (!st) return s
      const rounds = [...st.rounds]
      const r = rounds[rounds.length-1]; if (!r) return s
      r.colorCardCode = code
      return { state: { ...st, rounds } }
    }),

    drawColorCard: () => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r) return s
      if (st.deck.cursorColor >= st.deck.colorOrder.length && !st.settings.allowReshuffle) return s
      if (st.deck.cursorColor >= st.deck.colorOrder.length) st.deck.cursorColor = 0
      r.colorCardCode = st.deck.colorOrder[st.deck.cursorColor++]
      return { state: { ...st } }
    }),

    selectBlackCard: (code) => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r) return s
      r.blackCardCode = code
      return { state: { ...st } }
    }),

    drawBlackCard: () => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r) return s
      if (st.deck.cursorBlack >= st.deck.blackOrder.length && !st.settings.allowReshuffle) return s
      if (st.deck.cursorBlack >= st.deck.blackOrder.length) st.deck.cursorBlack = 0
      r.blackCardCode = st.deck.blackOrder[st.deck.cursorBlack++]
      return { state: { ...st } }
    }),

    submitTeam: (teamId, allocationAfter, emotion, pitch, emotionScore) => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r) return s

      // validations
      const sum = allocationAfter.equity + allocationAfter.debt + allocationAfter.gold + allocationAfter.cash
      if (Math.abs(sum - 100) > 0.001) return s
      const team = st.teams.find(t=>t.id===teamId)!
      const cap = st.settings.changeCapPct
      const shift = Math.abs(allocationAfter.equity - team.allocation.equity)
        + Math.abs(allocationAfter.debt - team.allocation.debt)
        + Math.abs(allocationAfter.gold - team.allocation.gold)
        + Math.abs(allocationAfter.cash - team.allocation.cash)
      if (shift > cap) return s

      const subIndex = r.submissions.findIndex(x=>x.teamId===teamId)
      const allocationBefore = { ...team.allocation }
      const sub = {
        teamId,
        allocationBefore,
        allocationAfter,
        emotion,
        pitchScore: pitch,
        emotionScore,
        portfolioReturn: 0,
        navAfter: team.nav
      }
      if (subIndex >= 0) r.submissions[subIndex] = sub as any
      else r.submissions.push(sub as any)
      return { state: { ...st } }
    }),

    applyResults: () => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r || !r.colorCardCode) return s
      const color = (s.cardsColor as any as Card[]).find(c=>c.code===r.colorCardCode)!
      const black = r.blackCardCode ? (s.cardsBlack as any as Card[]).find(c=>c.code===r.blackCardCode)! : undefined
      // compute each submission and update team
      for (const sub of r.submissions){
        const t = st.teams.find(x=>x.id===sub.teamId)!
        const pr = computePortfolioReturn(sub.allocationAfter, color, black)
        sub.portfolioReturn = pr
        sub.navAfter = t.nav * (1 + pr) + sub.pitchScore + sub.emotionScore
        // persist to team
        t.allocation = { ...sub.allocationAfter }
        t.nav = sub.navAfter
      }
      r.endedAt = now()
      return { state: { ...st } }
    }),

    undoRound: () => set(s => {
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
      st.rounds = st.rounds.slice(0, -1)
      return { state: { ...st } }
    }),

    rescoreRound: () => set(s => {
      const st = s.state; if (!st) return s
      const r = st.rounds[st.rounds.length-1]; if (!r) return s
      // First, restore teams to snapshot
      for (const snap of r.snapshotBefore.teams){
        const t = st.teams.find(x=>x.id===snap.teamId)!
        t.nav = snap.nav
        t.allocation = { ...snap.allocation }
      }
      // Then re-apply results
      if (!r.colorCardCode) return s
      const color = (s.cardsColor as any as Card[]).find(c=>c.code===r.colorCardCode)!
      const black = r.blackCardCode ? (s.cardsBlack as any as Card[]).find(c=>c.code===r.blackCardCode)! : undefined
      for (const sub of r.submissions){
        const t = st.teams.find(x=>x.id===sub.teamId)!
        const pr = computePortfolioReturn(sub.allocationAfter, color, black)
        sub.portfolioReturn = pr
        sub.navAfter = t.nav * (1 + pr) + sub.pitchScore + sub.emotionScore
        t.allocation = { ...sub.allocationAfter }
        t.nav = sub.navAfter
      }
      r.endedAt = now()
      return { state: { ...st } }
    }),

    endGame: () => set(s => {
      const st = s.state; if (!st) return s
      st.endedAt = now()
      return { state: { ...st } }
    }),
  }),
  {
    name: 'cyclesense:game:v1',
    storage: createJSONStorage(() => localStorage),
    version: 1
  }
))

export type { GameState }
export default useGame
