
import React from 'react'
import useGame from '../store/game'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function NavChart(){
  const game = useGame(s=>s.state)
  if (!game) return null

  const data: any[] = []
  const navByRound: Record<number, Record<string, number>> = {}
  const byTeam = Object.fromEntries(game.teams.map(t => [t.id, t.name]))
  for (const r of game.rounds) {
    navByRound[r.index] = {}
    for (const s of r.submissions) navByRound[r.index][byTeam[s.teamId]] = s.navAfter
  }
  const maxRound = Math.max(0, ...game.rounds.map(r => r.index))
  for (let i=0; i<=maxRound; i++) {
    const row: any = { round: i }
    for (const t of game.teams) row[t.name] = navByRound[i]?.[t.name] ?? null
    data.push(row)
  }

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">NAV Chart</div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="round" />
            <YAxis />
            <Tooltip />
            <Legend />
            {game.teams.map(t => (
              <Line key={t.id} type="monotone" dataKey={t.name} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
