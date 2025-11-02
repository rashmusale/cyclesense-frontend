import React, { useState } from 'react'
import useGame from '../store/game'
import { exportWorkbook, exportCSVs } from '../utils/export'

export default function AdminSidebar(){
  const game = useGame(s=>s.state)
  const newGame = useGame(s=>s.newGame)
  const addTeam = useGame(s=>s.addTeam)
  const startRound = useGame(s=>s.startRound)
  const drawColor = useGame(s=>s.drawColorCard)
  const selectColor = useGame(s=>s.selectColorCard)
  const drawBlack = useGame(s=>s.drawBlackCard)
  const selectBlack = useGame(s=>s.selectBlackCard)
  const applyColor = useGame(s=>s.applyResults)
  const applyBlack = useGame(s=>s.applyBlackResults)
  const undo = useGame(s=>s.undoRound)
  const rescore = useGame(s=>s.rescoreRound)
  const endGame = useGame(s=>s.endGame)
  const goNextRound = useGame(s=>s.goNextRound)
  const cardsColor = useGame(s=>s.cardsColor)
  const cardsBlack = useGame(s=>s.cardsBlack)

  const clear = () => { localStorage.removeItem('cyclesense_state'); location.reload() }

  const [teamName, setTeamName] = useState('')

  return (
    <div className="w-full md:w-64 card sticky top-2 h-fit space-y-3">
      <div className="text-xl font-semibold">Admin</div>
      <button className="btn-secondary w-full" onClick={clear}>Reset (Clear Save)</button>

      {!game && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Start new game</div>
          <div className="flex flex-col gap-2">
            <button className="btn w-full" onClick={()=>newGame('virtual')}>New (Virtual)</button>
            <button className="btn w-full" onClick={()=>newGame('inperson')}>New (In-Person)</button>
          </div>
        </div>
      )}

      {game && (
        <>
          {/* SETUP phase */}
          {game.uiPhase === 'setup' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Teams</div>
              <div className="flex flex-wrap gap-2">
                <input className="input flex-1 min-w-[120px]" placeholder="Team name" value={teamName} onChange={e=>setTeamName(e.target.value)} />
                <button className="btn" onClick={()=>{ if(teamName.trim()) { addTeam(teamName.trim()); setTeamName('') } }}>Add Team</button>
              </div>
              <button className="btn w-full" onClick={startRound}>Start First Round</button>
            </div>
          )}

          {/* ROUND START phase */}
          {game.uiPhase === 'roundStart' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Draw Color Card</div>
              <div className="flex flex-col gap-2">
                {game.mode==='virtual' ? (
                  <button className="btn w-full" onClick={drawColor}>Roll & Draw</button>
                ) : (
                  <>
                    <select className="input" onChange={(e)=>selectColor(e.target.value)} defaultValue="">
                      <option value="" disabled>Select Color Card</option>
                      {cardsColor.map(c=>(<option key={c.code} value={c.code}>{c.code} - {c.title}</option>))}
                    </select>
                    <button className="btn w-full" onClick={()=>{/* purely visual; select happens above */}}>Confirm Selection</button>
                  </>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-secondary flex-1" onClick={undo}>Undo Round</button>
              </div>
            </div>
          )}

          {/* TEAM INPUTS phase */}
          {game.uiPhase === 'teamInputs' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Collect allocations, pitch & emotion per team.</div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn w-full" onClick={applyColor}>Compute Scores (Color)</button>
                <button className="btn-secondary flex-1" onClick={rescore}>Rescore</button>
                <button className="btn-secondary flex-1" onClick={undo}>Undo Round</button>
              </div>
            </div>
          )}

          {/* POST-COLOR phase */}
          {game.uiPhase === 'postColor' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Black Card</div>
              <div className="flex flex-col gap-2">
                {game.mode==='virtual' ? (
                  <button className="btn w-full" onClick={drawBlack}>Draw Black</button>
                ) : (
                  <>
                    <select className="input" onChange={(e)=>selectBlack(e.target.value)} defaultValue="">
                      <option value="" disabled>Select Black Card</option>
                      {cardsBlack.map(c=>(<option key={c.code} value={c.code}>{c.code} - {c.title}</option>))}
                    </select>
                    <button className="btn w-full" onClick={applyBlack}>Apply Black Card</button>
                  </>
                )}
              </div>
              {game.mode==='virtual' && (
                <button className="btn w-full" onClick={applyBlack}>Apply Black Card</button>
              )}
            </div>
          )}

          {/* POST-BLACK phase */}
          {game.uiPhase === 'postBlack' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Leaderboard updated after black card.</div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn flex-1" onClick={goNextRound}>Start Next Round</button>
                <button className="btn-secondary flex-1" onClick={endGame}>End Game</button>
              </div>
            </div>
          )}

          {/* END phase */}
          {game.uiPhase === 'end' && (
            <div className="space-y-2">
              <button className="btn w-full" onClick={()=>game && exportWorkbook(game)}>Download Excel</button>
              <button className="btn-secondary w-full" onClick={()=>game && exportCSVs(game)}>Download CSVs</button>
              <div className="flex gap-2">
                <button className="btn flex-1" onClick={()=>newGame('virtual')}>New Game (Virtual)</button>
                <button className="btn flex-1" onClick={()=>newGame('inperson')}>New Game (In-Person)</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
