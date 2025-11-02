import React, { useState } from 'react'
import useGame, { Mode, Allocation } from '../store/game'

function sumAlloc(a: Allocation){ return a.equity + a.debt + a.gold + a.cash }

export default function SetupWizard(){
  const game = useGame(s=>s.state)
  const newGame = useGame(s=>s.newGame)
  const addTeam = useGame(s=>s.addTeam)

  const [mode, setMode] = useState<Mode>('virtual')
  const [teamName, setTeamName] = useState('')
  const [alloc, setAlloc] = useState<Allocation>({equity:25, debt:25, gold:25, cash:25})

  if (game) return null

  return (
    <div className="card max-w-3xl mx-auto mt-6">
      <div className="text-xl font-semibold">Game Setup</div>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="border rounded-xl p-3">
          <div className="font-medium mb-2">1) Choose Mode</div>
          <div className="flex gap-2">
            <button className={"btn " + (mode==='virtual'?'':'opacity-70')} onClick={()=>setMode('virtual')}>Virtual</button>
            <button className={"btn " + (mode==='inperson'?'':'opacity-70')} onClick={()=>setMode('inperson')}>In-Person</button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Virtual: Die roll & card draw on screen. In-Person: Facilitator selects cards.
          </p>
          <div className="mt-4">
            <button className="btn" onClick={()=>newGame(mode)}>Start New Game</button>
          </div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="font-medium mb-2">2) Configure Teams</div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Team name" value={teamName} onChange={e=>setTeamName(e.target.value)} />
            <button className="btn" onClick={()=>{
              if (!teamName.trim()) return
              addTeam(teamName.trim())
              setTeamName('')
            }}>Add Team</button>
          </div>
          <div className="text-sm text-gray-600 mt-2">Initial allocation (must sum to 100%)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {(['equity','debt','gold','cash'] as (keyof Allocation)[]).map(k=>(
              <label key={k} className="text-sm">
                <div className="text-gray-600">{k.toUpperCase()}</div>
                <input type="number" className="input w-full" value={alloc[k]} onChange={(e)=>{
                  const v = parseFloat(e.target.value||'0')
                  setAlloc({...alloc, [k]: v})
                }}/>
              </label>
            ))}
          </div>
          <div className={(Math.abs(sumAlloc(alloc)-100)<0.001?'text-green-600':'text-red-600') + ' text-sm mt-2'}>
            Sum: {sumAlloc(alloc).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-2">New teams start at NAV 10 (₹100 Cr).</p>
        </div>
      </div>
    </div>
  )
}
