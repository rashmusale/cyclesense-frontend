import React from 'react'
import useGame from '../store/game'

export default function RoundFlowHeader(){
  const game = useGame(s=>s.state)
  if (!game || game.rounds.length===0) return null
  const r = game.rounds[game.rounds.length-1]

  const stages = [
    { key: 'color',   label: 'Draw Color' ,       done: !!r.colorCardCode },
    { key: 'inputs',  label: 'Team Inputs',       done: r.submissions.length>0 },
    { key: 'compute', label: 'Compute (Color)',   done: !!r.endedAt },
    { key: 'black',   label: 'Apply Black',       done: !!r.blackCardCode },
  ]

  return (
    <div className="card">
      <div className="text-lg font-semibold">Round {r.index} Flow</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {stages.map((s, i)=>(
          <div key={s.key} className={"px-3 py-1 rounded-full text-sm " + (s.done ? 'bg-green-600 text-white' : 'bg-gray-200')}>
            {i+1}. {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
