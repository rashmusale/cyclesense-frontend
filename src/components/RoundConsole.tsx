import React, { useState } from 'react'
import useGame, { Allocation, Emotion } from '../store/game'

export default function RoundConsole(){
  const game = useGame(s=>s.state)
  const cardsColor = useGame(s=>s.cardsColor)
  const cardsBlack = useGame(s=>s.cardsBlack)

  const drawColor = useGame(s=>s.drawColorCard)
  const selectColor = useGame(s=>s.selectColorCard)
  const drawBlack = useGame(s=>s.drawBlackCard)
  const selectBlack = useGame(s=>s.selectBlackCard)

  const stage = useGame(s=>s.stageAllocation)
  const submitAll = useGame(s=>s.submitAllTeamsForRound)
  const undoStage = useGame(s=>s.undoRoundStaging)
  const applyColor = useGame(s=>s.applyResults)

  if (!game) return <div className="card">Start a game to continue.</div>
  const r = game.rounds.at(-1)

  const locked = !!r?.allocationsLocked
  const [emotion, setEmotion] = useState<Emotion>('Patience')
  const [pitch, setPitch] = useState(0)
  const [emoScore, setEmoScore] = useState(0)

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="text-lg font-semibold">Round Console</div>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Color Card</div>
            <button className="btn" onClick={drawColor}>Roll & Draw</button>
            <div className="flex gap-2 mt-2">
              <select className="input" onChange={e=>selectColor(e.target.value)} defaultValue="">
                <option value="" disabled>Select code</option>
                {cardsColor.map(c=>(<option key={c.code} value={c.code}>{c.code} — {c.title}</option>))}
              </select>
              <button className="btn" onClick={()=>{ /* selection is handled by onChange */ }}>Confirm</button>
            </div>
          </div>
          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Black / Wild</div>
            <button className="btn" onClick={drawBlack}>Draw Black</button>
            <div className="flex gap-2 mt-2">
              <select className="input" onChange={e=>selectBlack(e.target.value)} defaultValue="">
                <option value="" disabled>Select code</option>
                {cardsBlack.map(c=>(<option key={c.code} value={c.code}>{c.code} — {c.title}</option>))}
              </select>
              <button className="btn" onClick={()=>{ /* selection handled by onChange */ }}>Confirm</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Allocations freeze once a black/wild card is drawn.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-lg font-semibold mb-2">Team Inputs</div>

        {/* global emotion/pitch controls (applied to each team's staged submission) */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <label className="text-sm">
            <div className="text-gray-600">Emotion</div>
            <select className="input w-full" disabled={locked} value={emotion} onChange={e=>setEmotion(e.target.value as Emotion)}>
              {['Confidence','Discipline','Patience','Conviction','Adaptability'].map(x=>(<option key={x} value={x}>{x}</option>))}
            </select>
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Pitch (0–5)</div>
            <input type="number" min={0} max={5} className="input w-full" disabled={locked} value={pitch} onChange={e=>setPitch(parseInt(e.target.value||'0'))}/>
          </label>
          <label className="text-sm">
            <div className="text-gray-600">Emotion Score (0–5)</div>
            <input type="number" min={0} max={5} className="input w-full" disabled={locked} value={emoScore} onChange={e=>setEmoScore(parseInt(e.target.value||'0'))}/>
          </label>
        </div>

        {game.teams.map(t=>{
          return (
            <div key={t.id} className="border rounded-xl p-3 mb-2">
              <div className="font-medium">{t.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {(['equity','debt','gold','cash'] as (keyof Allocation)[]).map(k=>(
                  <label key={k} className="text-sm">
                    <div className="text-gray-600">{k.toUpperCase()}</div>
                    <input
                      type="number"
                      className="input w-full"
                      defaultValue={t.allocation[k]}
                      disabled={locked}
                      onChange={(e)=>{
                        const val = parseFloat(e.target.value||'0')
                        const next = { ...t.allocation, [k]: val } as Allocation
                        stage(t.id, next, emotion, pitch, emoScore) // stage, do NOT compute yet
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          )
        })}

        <div className="flex gap-2 mt-2 flex-wrap">
          <button className="btn" onClick={submitAll} disabled={!r || (r?.submissions?.length ?? 0) !== game.teams.length}>
            Submit All Teams for This Round
          </button>
          <button className="btn-secondary" onClick={undoStage}>
            Undo Submissions (Edit Again)
          </button>
          <button className="btn" onClick={applyColor} disabled={!r?.submittedAll}>
            Compute Scores (Color)
          </button>
        </div>
      </div>
    </div>
  )
}
