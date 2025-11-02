
import React from 'react'
import useGame from '../store/game'

export default function ResultsTable(){
  const game = useGame(s=>s.state)
  if (!game || game.rounds.length===0) return null
  const r = game.rounds[game.rounds.length-1]
  if (r.submissions.length===0) return null

  const teamName = (id: string) => game.teams.find(t=>t.id===id)?.name || id

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Round {r.index} Results</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="text-left p-2">Team</th>
            <th className="text-left p-2">Portfolio Return</th>
            <th className="text-left p-2">Pitch</th>
            <th className="text-left p-2">Emotion</th>
            <th className="text-left p-2">Emotion Score</th>
            <th className="text-left p-2">NAV After</th>
          </tr></thead>
          <tbody>
            {r.submissions.map(s => (
              <tr key={s.teamId} className="border-t">
                <td className="p-2">{teamName(s.teamId)}</td>
                <td className="p-2">{(s.portfolioReturn*100).toFixed(2)}%</td>
                <td className="p-2">{s.pitchScore}</td>
                <td className="p-2 flex items-center gap-2">
                  <img src={`/emotions/${s.emotion}.svg`} alt={s.emotion} width={18} height={18}/>
                  {s.emotion}
                </td>
                <td className="p-2">{s.emotionScore}</td>
                <td className="p-2 font-semibold">{s.navAfter.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
