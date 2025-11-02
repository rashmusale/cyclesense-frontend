
import React from 'react'
import useGame from '../store/game'

export default function CardOverlay(){
  const game = useGame(s=>s.state)
  const cardsColor = useGame(s=>s.cardsColor)
  const cardsBlack = useGame(s=>s.cardsBlack)
  if (!game || game.rounds.length===0) return null
  const r = game.rounds[game.rounds.length-1]
  const c = r.colorCardCode ? cardsColor.find(x=>x.code===r.colorCardCode) : null
  const b = r.blackCardCode ? cardsBlack.find(x=>x.code===r.blackCardCode) : null
  if (!c) return null

  const imgPath = c.image_path || `/cards/color/${c.code.toLowerCase()}.png`
  const imgBlack = b ? (b.image_path || `/cards/black/${b.code.toLowerCase()}.png`) : null

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Current Card</div>
        {b && <div className="text-sm text-gray-600">Black Overlay: {b.code}</div>}
      </div>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center h-56">
          <img src={imgPath} alt={c.title} className="max-h-56" onError={(e)=>{ (e.target as HTMLImageElement).style.display='none' }} />
          <div className="p-4 text-center">
            <div className="font-semibold">{c.code} — {c.title}</div>
            <div className="text-sm text-gray-600">{c.text}</div>
          </div>
        </div>
        {imgBlack && (
          <div className="border rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center h-56">
            <img src={imgBlack} alt={b?.title} className="max-h-56" onError={(e)=>{ (e.target as HTMLImageElement).style.display='none' }} />
            <div className="p-4 text-center">
              <div className="font-semibold">{b?.code} — {b?.title}</div>
              <div className="text-sm text-gray-600">{b?.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
