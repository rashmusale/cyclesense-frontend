import React from 'react'
import useGame from '../store/game'
import { exportWorkbook, exportCSVs } from '../utils/export'

export default function GameEnd(){
  const game = useGame(s=>s.state)
  const newGame = useGame(s=>s.newGame)
  if (!game?.endedAt) return null
  const top = [...game.teams].sort((a,b)=>b.nav-a.nav)[0]

  return (
    <div className="card">
      <div className="text-xl font-semibold">Game Over</div>
      <div className="mt-2">🏆 Top Performer: <span className="font-semibold">{top?.name}</span> — Final NAV {top?.nav.toFixed(2)}</div>
      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={()=>exportWorkbook(game)}>Download Excel</button>
        <button className="btn-secondary" onClick={()=>exportCSVs(game)}>Download CSVs</button>
      </div>
      <div className="mt-4">
        <button className="btn" onClick={()=>newGame('virtual')}>Start New Game</button>
      </div>
    </div>
  )
}
