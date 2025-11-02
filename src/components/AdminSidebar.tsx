
import React, { useState } from 'react'
import useGame from '../store/game'
import { exportWorkbook, exportCSVs } from '../utils/export'

export default function AdminSidebar(){
  const game = useGame(s=>s.state)
  const newGame = useGame(s=>s.newGame)
  const addTeam = useGame(s=>s.addTeam)
  const startRound = useGame(s=>s.startRound)
  const drawColor = useGame(s=>s.drawColorCard)
  const drawBlack = useGame(s=>s.drawBlackCard)
  const apply = useGame(s=>s.applyResults)
  const undo = useGame(s=>s.undoRound)
  const rescore = useGame(s=>s.rescoreRound)
  const endGame = useGame(s=>s.endGame)
  const selectColor = useGame(s=>s.selectColorCard)
  const selectBlack = useGame(s=>s.selectBlackCard)
  const cardsColor = useGame(s=>s.cardsColor)
  const cardsBlack = useGame(s=>s.cardsBlack)

  const [teamName, setTeamName] = useState('')

  return (
    <div className="w-full md:w-64 card sticky top-2 h-fit space-y-3">
      <div className="text-xl font-semibold">Admin</div>
      <div className="space-y-2">
        {!game && (
          <>
            <div className="text-sm text-gray-600">Start new game</div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>newGame('virtual')}>New (Virtual)</button>
              <button className="btn" onClick={()=>newGame('inperson')}>New (In-Person)</button>
            </div>
          </>
        )}
        {game && (
          <>
            <div className="flex gap-2">
              <button className="btn" onClick={startRound}>Start Round</button>
              <button className="btn-secondary" onClick={undo}>Undo Round</button>
            </div>
            <div className="flex gap-2">
              {game.mode==='virtual' ? (
                <>
                  <button className="btn" onClick={drawColor}>Draw Color</button>
                  <button className="btn-secondary" onClick={drawBlack}>Draw Black</button>
                </>
              ) : (
                <>
                  <select className="input" onChange={(e)=>selectColor(e.target.value)} defaultValue="">
                    <option value="" disabled>Select Color Card</option>
                    {cardsColor.map(c=>(<option key={c.code} value={c.code}>{c.code} - {c.title}</option>))}
                  </select>
                  <select className="input" onChange={(e)=>selectBlack(e.target.value)} defaultValue="">
                    <option value="" disabled>Select Black Card</option>
                    {cardsBlack.map(c=>(<option key={c.code} value={c.code}>{c.code} - {c.title}</option>))}
                  </select>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={apply}>Apply Results</button>
              <button className="btn-secondary" onClick={rescore}>Rescore</button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Team name" value={teamName} onChange={e=>setTeamName(e.target.value)} />
                <button className="btn" onClick={()=>{ if(teamName.trim()) { addTeam(teamName.trim()); setTeamName('') } }}>Add Team</button>
              </div>
            </div>
            <div className="space-y-2">
              <button className="btn w-full" onClick={()=>game && exportWorkbook(game)}>Download Excel</button>
              <button className="btn-secondary w-full" onClick={()=>game && exportCSVs(game)}>Download CSVs</button>
              <button className="btn w-full" onClick={endGame}>End Game (auto-download)</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
