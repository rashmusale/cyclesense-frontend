import React from 'react'
import useGame from '../store/game'

export default function CurrentAllocations(){
  const game = useGame(s=>s.state)
  if (!game) return null

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Current Allocations (View only)</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Team</th>
              <th className="py-2 pr-4">Equity</th>
              <th className="py-2 pr-4">Debt</th>
              <th className="py-2 pr-4">Gold</th>
              <th className="py-2 pr-4">Cash</th>
            </tr>
          </thead>
          <tbody>
            {game.teams.map(t=>(
              <tr key={t.id} className="border-t">
                <td className="py-2 pr-4">{t.name}</td>
                <td className="py-2 pr-4">{t.allocation.equity}%</td>
                <td className="py-2 pr-4">{t.allocation.debt}%</td>
                <td className="py-2 pr-4">{t.allocation.gold}%</td>
                <td className="py-2 pr-4">{t.allocation.cash}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
