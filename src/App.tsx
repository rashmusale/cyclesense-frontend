
import React, { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import Leaderboard from './components/Leaderboard'
import CurrentAllocations from './components/CurrentAllocations'
import HistoricalAllocations from './components/HistoricalAllocations'
import NavChart from './components/NavChart'
import RoundConsole from './components/RoundConsole'
import ResultsTable from './components/ResultsTable'
import useGame from './store/game'
import { exportWorkbook } from './utils/export'
import SetupWizard from './components/SetupWizard'
import GameEnd from './components/GameEnd'

function Tabs(){
  const loc = useLocation()
  const tabs = [
    { to: '/', label: 'Leaderboard' },
    { to: '/allocations', label: 'Current Allocations' },
    { to: '/history', label: 'Historical Allocations' },
    { to: '/nav', label: 'NAV Chart' },
    { to: '/round', label: 'Round Console' },
  ]
  return (
    <div className="card mb-3 overflow-x-auto">
      <div className="flex gap-2">
        {tabs.map(t => (
          <Link key={t.to} to={t.to} className={'tab ' + (loc.pathname===t.to ? 'tab-active' : 'bg-gray-100')}>{t.label}</Link>
        ))}
      </div>
    </div>
  )
}

export default function App(){
  const game = useGame(s=>s.state)

  // Auto-download at End Game
  useEffect(()=>{
    if (game?.endedAt) {
      // slight delay to ensure state persisted
      setTimeout(()=> exportWorkbook(game), 300)
    }
  }, [game?.endedAt])

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <div className="md:grid md:grid-cols-12 gap-4">
        <div className="md:col-span-3 order-2 md:order-1"><AdminSidebar /></div>
        <div className="md:col-span-9 space-y-3 order-1 md:order-2">
          <Tabs />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Setup screen only when no game or in setup */}
                  {(!game || game.uiPhase === 'setup') && <SetupWizard />}

                  {/* Round screens */}
                  {game?.uiPhase === 'roundStart' && <>
                    <Leaderboard />
                    {/* CardOverlay already visible from RoundConsole */}
                    <RoundConsole />
                  </>}

                  {game?.uiPhase === 'teamInputs' && <>
                    <Leaderboard />
                    <RoundConsole />
                  </>}

                  {game?.uiPhase === 'postColor' && <>
                    <Leaderboard />
                    <ResultsTable />
                    <RoundConsole />
                  </>}

                  {game?.uiPhase === 'postBlack' && <>
                    <Leaderboard />
                    <ResultsTable />
                    <RoundConsole />
                  </>}

                  {/* End screen */}
                  {game?.uiPhase === 'end' && <>
                    <Leaderboard />
                    <ResultsTable />
                    <GameEnd />
                  </>}
                </>
              }
            />
            <Route path="/allocations" element={<CurrentAllocations />} />
            <Route path="/history" element={<HistoricalAllocations />} />
            <Route path="/nav" element={<NavChart />} />
            <Route path="/round" element={<RoundConsole />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
