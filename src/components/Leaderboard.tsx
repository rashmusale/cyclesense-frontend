
import React from 'react'
import useGame from '../store/game'

export default function Leaderboard(){
  const game = useGame(s=>s.state)
  if (!game) return null
  const teams = [...game.teams].sort((a,b)=>b.nav - a.nav)
  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Leaderboard</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((t, i)=>(
          <div key={t.id} className="p-3 rounded-xl border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bold text-xl">#{i+1}</div>
              <div className="font-medium">{t.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">NAV</div>
              <div className="text-xl font-semibold">{t.nav.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
