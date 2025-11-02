
import React from 'react'
import useGame, { Allocation } from '../store/game'

export default function CurrentAllocations(){
  const game = useGame(s=>s.state)
  const submit = useGame(s=>s.submitTeam)
  if (!game) return null

  const changeAlloc = (a: Allocation, k: keyof Allocation, v: number) => ({ ...a, [k]: v })

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Current Allocations</div>
      <div className="space-y-4">
        {game.teams.map(t => {
          const [eq, de, go, ca] = [t.allocation.equity, t.allocation.debt, t.allocation.gold, t.allocation.cash]
          const sum = eq+de+go+ca
          return (
            <div key={t.id} className="border rounded-xl p-3">
              <div className="font-medium">{t.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {(['equity','debt','gold','cash'] as (keyof Allocation)[]).map(k => (
                  <label key={k} className="text-sm">
                    <div className="text-gray-600">{k.toUpperCase()}</div>
                    <input type="number" className="input w-full" defaultValue={t.allocation[k]}
                      onBlur={(e)=>{
                        const v = parseFloat(e.target.value||'0')
                        t.allocation = changeAlloc(t.allocation, k, v)
                      }}/>
                  </label>
                ))}
              </div>
              <div className={"text-sm mt-2 " + (Math.abs(sum-100)<0.001?'text-green-600':'text-red-600')}>
                Sum: {sum.toFixed(2)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
