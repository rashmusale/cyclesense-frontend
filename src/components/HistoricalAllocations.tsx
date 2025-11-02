
import React from 'react'
import useGame from '../store/game'

export default function HistoricalAllocations(){
  const game = useGame(s=>s.state)
  if (!game) return null
  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Historical Allocations</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="text-left p-2">Round</th>
            <th className="text-left p-2">Team</th>
            <th className="text-left p-2">Emotion</th>
            <th className="text-left p-2">Pitch</th>
            <th className="text-left p-2">Emotion Score</th>
            <th className="text-left p-2">Before</th>
            <th className="text-left p-2">After</th>
          </tr></thead>
          <tbody>
            {game.rounds.map(r => r.submissions.map(s => {
              const before = s.allocationBefore
              const after = s.allocationAfter
              const team = game.teams.find(t=>t.id===s.teamId)!
              return (
                <tr key={r.id + s.teamId} className="border-t">
                  <td className="p-2">{r.index}</td>
                  <td className="p-2">{team.name}</td>
                  <td className="p-2">{s.emotion}</td>
                  <td className="p-2">{s.pitchScore}</td>
                  <td className="p-2">{s.emotionScore}</td>
                  <td className="p-2">{before.equity}/{before.debt}/{before.gold}/{before.cash}</td>
                  <td className="p-2">{after.equity}/{after.debt}/{after.gold}/{after.cash}</td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
