import { useState } from 'react'

import ZoneDiagram from './components/ZoneDiagram'

export default function App() {
  const [blocks, setBlocks] = useState([{ id: 1, reps: [] }])
  const [view, setView] = useState('logging')
  const [missNext, setMissNext] = useState(false)

  const currentBlock = blocks[blocks.length - 1]

  function logRep(reward) {
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? { ...block, reps: [...block.reps, { id: block.reps.length + 1, reward, missed: missNext }] }
        : block
    ))
    setMissNext(false)
  }

  function undo() {
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? { ...block, reps: block.reps.slice(0, -1) }
        : block
    ))
  }

  function newBlock() {
    setBlocks([...blocks, { id: blocks.length + 1, reps: [] }])
  }

  function startNewSession() {
    setBlocks([{ id: 1, reps: [] }])
    setMissNext(false)
    setView('logging')
  }

  const allReps = blocks.flatMap((b) => b.reps)
  const total = allReps.length
  const rewarded = allReps.filter((r) => r.reward !== 'none').length
  const misses = allReps.filter((r) => r.missed).length
  const jackpots = allReps.filter((r) => r.reward === 'jackpot').length
  const successRate = total === 0 ? 0 : Math.round((rewarded / total) * 100)

  // Phone frame: centres a phone-width column on desktop, full width on mobile.
  const Frame = ({ children }) => (
    <div className="h-screen bg-black flex justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col overflow-hidden bg-brand-brown text-white">
        {children}
      </div>
    </div>
  )

  // ── SUMMARY SCREEN ──────────────────────────────
  if (view === 'summary') {
    return (
      <Frame>
        <header className="p-4 text-center border-b border-white/10">
          <h1 className="text-xl font-bold">Session Summary</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-6xl font-bold">{successRate}%</p>
            <p className="text-brand-orange mt-1">rewarded</p>
          </div>
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between py-2 border-b border-white/10"><span>Total reps</span><span>{total}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span>Jackpots</span><span>{jackpots}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span>Missed</span><span>{misses}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span>Blocks</span><span>{blocks.length}</span></div>
          </div>
        </main>
        <footer className="p-4 border-t border-white/10">
          <button onClick={startNewSession} className="w-full py-4 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90">
            Start new session
          </button>
        </footer>
      </Frame>
    )
  }

  // ── LOGGING SCREEN ──────────────────────────────
  return (
    <Frame>
      {/* Header */}
      <header className="p-4 text-center border-b border-white/10">
        <h1 className="text-xl font-bold">Quick Log</h1>
        <p className="text-brand-orange text-sm mt-1">
          {total} reps · {successRate}% rewarded · {misses} missed
        </p>
      </header>

      {/* Scrolling middle — the rep list (the zone diagram will live here next) */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <ZoneDiagram />
        {blocks.slice().reverse().map((block) => (
          <div key={block.id}>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
              Block {block.id} · {block.reps.length} reps
            </p>
            {block.reps.slice().reverse().map((rep) => (
              <div key={rep.id} className="flex justify-between py-2 border-b border-white/10 text-sm">
                <span>Rep {rep.id}{rep.missed && ' · miss'}</span>
                <span className="text-brand-orange">{rep.reward}</span>
              </div>
            ))}
            {block.reps.length === 0 && <p className="text-white/30 text-sm py-2">No reps yet</p>}
          </div>
        ))}
      </main>

      {/* Fixed bottom controls — thumb zone */}
      <footer className="p-4 border-t border-white/10 flex flex-col gap-3">
        <button
          onClick={() => setMissNext(!missNext)}
          className={`w-full py-2.5 rounded-xl border text-sm transition ${
            missNext ? 'bg-white text-brand-brown border-white font-bold' : 'border-white/30 active:bg-white/10'
          }`}
        >
          {missNext ? '✓ Miss — now pick a reward' : 'Mark as miss'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => logRep('none')} className="py-5 rounded-xl bg-white/10 active:bg-white/20 text-sm">No reward</button>
          <button onClick={() => logRep('reward')} className="py-5 rounded-xl bg-white/20 active:bg-white/30 text-sm">Reward</button>
          <button onClick={() => logRep('jackpot')} className="py-5 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90 text-sm">Jackpot</button>
        </div>

        <div className="flex justify-between text-sm pt-1">
          <button onClick={undo} disabled={currentBlock.reps.length === 0} className="text-white/50 underline disabled:opacity-30">Undo</button>
          <button onClick={newBlock} className="text-brand-orange underline">+ New block</button>
          <button onClick={() => setView('summary')} disabled={total === 0} className="text-white underline disabled:opacity-30">End session</button>
        </div>
      </footer>
    </Frame>
  )
}