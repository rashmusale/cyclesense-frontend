import React, { useMemo, useState } from 'react'
import useGame, { Allocation, Emotion } from '../store/game'
import CardOverlay from './CardOverlay'
import RoundFlowHeader from './RoundFlowHeader'

const phases = ['Green','Blue','Orange','Red'] as const
const phaseToCodePrefix: Record<typeof phases[number], string> = {
  Green: 'G', Blue: 'B', Orange: 'O', Red: 'R'
}

export default function RoundConsole(){
  const game = useGame(s=>s.state)
  const drawColor = useGame(s=>s.drawColorCard)
  const selectColor = useGame(s=>s.selectColorCard)
  const drawBlack = useGame(s=>s.drawBlackCard)
  const submitTeam = useGame(s=>s.submitTeam)
  const cardsColor = useGame(s=>s.cardsColor)

  if (!game) return null
  const r = game.rounds[game.rounds.length-1]

  const [form, setForm] = useState<Record<string, { alloc: Allocation, emotion: Emotion, pitch: number, emoScore: number}>>({})
  const [phase, setPhase] = useState<typeof phases[number]>('Green')

  if (!r) return <div className="card">Start a round to begin.</div>

  const colorCard = useMemo(()=> r?.colorCardCode ? cardsColor.find(c=>c.code===r.colorCardCode) : null, [r, cardsColor])

  return (
    <div className="space-y-3">
      <RoundFlowHeader />
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Round {r.index} Console</div>
          <div className="text-sm text-gray-600">{r.colorCardCode ? ('Card: '+r.colorCardCode) : 'No card yet'}</div>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Draw Color</div>
            {game.mode==='virtual' ? (
              <button className="btn" onClick={drawColor}>Roll & Draw</button>
            ) : (
              <div className="flex gap-2">
                <select className="input" value={phase} onChange={e=>setPhase(e.target.value as any)}>
                  {phases.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <button className="btn" onClick={()=>{
                  const prefix = phaseToCodePrefix[phase]
                  const any = (game.deck.colorOrder.find(c=>c.startsWith(prefix)) || 'G1')
                  selectColor(any)
                }}>Select Phase</button>
              </div>
            )}
          </div>

          <div className="border rounded-xl p-3">
            <div className="font-medium mb-2">Black Card</div>
            <button className="btn" onClick={drawBlack}>Draw/Queue Black</button>
          </div>
        </div>
      </div>

      <CardOverlay />

      <div className="card">
        <div className="text-lg font-semibold mb-2">Team Inputs</div>
        {game.teams.map(t => {
          const state = form[t.id] || { alloc: { ...t.allocation }, emotion: 'Patience' as Emotion, pitch: 0, emoScore: 0 }
          const set = (patch: Partial<typeof state>) => { form[t.id] = { ...state, ...patch }; setForm({ ...form }) }
          const sum = state.alloc.equity + state.alloc.debt + state.alloc.gold + state.alloc.cash
          const shift = Math.abs(state.alloc.equity - t.allocation.equity)
            + Math.abs(state.alloc.debt - t.allocation.debt)
            + Math.abs(state.alloc.gold - t.allocation.gold)
            + Math.abs(state.alloc.cash - t.allocation.cash)
          const valid = Math.abs(sum-100)<0.001 && shift <= game.settings.changeCapPct && !!r.colorCardCode

          return (
            <div key={t.id} className="border rounded-xl p-3 mb-3">
              <div className="font-medium">{t.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {(['equity','debt','gold','cash'] as (keyof Allocation)[]).map(k => (
                  <label key={k} className="text-sm">
                    <div className="text-gray-600">{k.toUpperCase()}</div>
                    <input type="number" className="input w-full" value={state.alloc[k]}
                      onChange={(e)=> set({ alloc: { ...state.alloc, [k]: parseFloat(e.target.value||'0') } as Allocation })}/>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <label className="text-sm">
                  <div className="text-gray-600">Emotion</div>
                  <select className="input w-full" value={state.emotion} onChange={(e)=> set({ emotion: e.target.value as Emotion })}>
                    {['Confidence','Discipline','Patience','Conviction','Adaptability'].map(e=>(<option key={e} value={e}>{e}</option>))}
                  </select>
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Pitch (0–5)</div>
                  <input type="number" min={0} max={5} className="input w-full" value={state.pitch}
                    onChange={(e)=> set({ pitch: Math.max(0, Math.min(5, parseInt(e.target.value||'0'))) })}/>
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Emotion Score (0–5)</div>
                  <input type="number" min={0} max={5} className="input w-full" value={state.emoScore}
                    onChange={(e)=> set({ emoScore: Math.max(0, Math.min(5, parseInt(e.target.value||'0'))) })}/>
                </label>
                <div className={"self-end text-sm " + (valid?'text-green-600':'text-red-600')}>
                  Sum {sum.toFixed(1)}%, Move {shift.toFixed(1)}pp / cap {game.settings.changeCapPct}%
                </div>
              </div>
              <div className="mt-2">
                <button className="btn" disabled={!valid} onClick={()=>{
                  submitTeam(t.id, state.alloc, state.emotion, state.pitch, state.emoScore)
                }}>Submit</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}