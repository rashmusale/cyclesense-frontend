
import * as XLSX from 'xlsx'
import { saveAs } from './file'
import type { GameState } from '../store/game'

function toCSV(rows: any[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

function downloadFile(name: string, data: BlobPart, type='text/csv') {
  const blob = new Blob([data], { type })
  saveAs(blob, name)
}

export function exportWorkbook(state: GameState) {
  const wb = XLSX.utils.book_new()

  const teams = state.teams.map(t => ({
    teamId: t.id, name: t.name, nav: t.nav.toFixed(2),
    equity_pct: t.allocation.equity, debt_pct: t.allocation.debt,
    gold_pct: t.allocation.gold, cash_pct: t.allocation.cash
  }))
  const wsTeams = XLSX.utils.json_to_sheet(teams)
  XLSX.utils.book_append_sheet(wb, wsTeams, 'teams')

  const rounds = state.rounds.map(r => ({
    index: r.index, colorCard: r.colorCardCode, blackCard: r.blackCardCode,
    startedAt: r.startedAt, endedAt: r.endedAt || ''
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rounds), 'rounds')

  const teamRounds = []
  for (const r of state.rounds) {
    for (const s of r.submissions) {
      teamRounds.push({
        round: r.index, teamId: s.teamId, emotion: s.emotion,
        pitchScore: s.pitchScore, emotionScore: s.emotionScore,
        portfolioReturn: s.portfolioReturn,
        navAfter: s.navAfter,
        before_equity: s.allocationBefore.equity, before_debt: s.allocationBefore.debt,
        before_gold: s.allocationBefore.gold, before_cash: s.allocationBefore.cash,
        after_equity: s.allocationAfter.equity, after_debt: s.allocationAfter.debt,
        after_gold: s.allocationAfter.gold, after_cash: s.allocationAfter.cash
      })
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamRounds), 'team_rounds')

  // NAV series (wide)
  const series: any[] = []
  const header = ['round', ...state.teams.map(t => t.name)]
  const byTeam = Object.fromEntries(state.teams.map(t => [t.id, t.name]))
  const navByRound: Record<number, Record<string, number>> = {}
  for (const r of state.rounds) {
    navByRound[r.index] = {}
    for (const s of r.submissions) navByRound[r.index][byTeam[s.teamId]] = s.navAfter
  }
  const maxRound = Math.max(0, ...state.rounds.map(r => r.index))
  for (let i=0; i<=maxRound; i++) {
    const row: any = { round: i }
    for (const t of state.teams) row[t.name] = navByRound[i]?.[t.name] ?? null
    series.push(row)
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(series), 'nav_series')

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadFile('cyclesense_game.xlsx', out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export function exportCSVs(state: GameState) {
  const teams = state.teams.map(t => ({
    teamId: t.id, name: t.name, nav: t.nav.toFixed(2),
    equity_pct: t.allocation.equity, debt_pct: t.allocation.debt,
    gold_pct: t.allocation.gold, cash_pct: t.allocation.cash
  }))
  const rounds = state.rounds.map(r => ({
    index: r.index, colorCard: r.colorCardCode, blackCard: r.blackCardCode,
    startedAt: r.startedAt, endedAt: r.endedAt || ''
  }))
  const teamRounds = []
  for (const r of state.rounds) {
    for (const s of r.submissions) {
      teamRounds.push({
        round: r.index, teamId: s.teamId, emotion: s.emotion,
        pitchScore: s.pitchScore, emotionScore: s.emotionScore,
        portfolioReturn: s.portfolioReturn, navAfter: s.navAfter,
        before_equity: s.allocationBefore.equity, before_debt: s.allocationBefore.debt,
        before_gold: s.allocationBefore.gold, before_cash: s.allocationBefore.cash,
        after_equity: s.allocationAfter.equity, after_debt: s.allocationAfter.debt,
        after_gold: s.allocationAfter.gold, after_cash: s.allocationAfter.cash
      })
    }
  }
  downloadFile('teams.csv', toCSV(teams))
  downloadFile('rounds.csv', toCSV(rounds))
  downloadFile('team_rounds.csv', toCSV(teamRounds))
}
