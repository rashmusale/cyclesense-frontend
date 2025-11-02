import React from 'react'
import useGame from '../store/game'

export default function StartPanel(){
  const newGame = useGame(s=>s.newGame)
  return (
    <div className="card max-w-xl mx-auto mt-10 text-center space-y-4">
      <h1 className="text-2xl font-semibold">CycleSense</h1>
      <p className="text-gray-600">Start a new session</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button className="btn" onClick={()=>newGame('virtual')}>New Game (Virtual)</button>
        <button className="btn" onClick={()=>newGame('inperson')}>New Game (In-Person)</button>
      </div>
      <p className="text-xs text-gray-500">Tip: you can switch modes anytime by ending and starting a new game.</p>
    </div>
  )
}
