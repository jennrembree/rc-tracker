import { useState } from 'react'

export default function App() {
  const [blocks, setBlocks] = useState([{ id: 1, reps: [] }])
  const [view, setView] = useState('logging')
  const [missNext, setMissNext] = useState(false) // is the NEXT rep a miss?

  const currentBlock = blocks[blocks.length - 1]

  function logRep(reward) {
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? { ...block, reps: [...block.reps, { id: block.reps.length + 1, reward, missed: missNext }] }
        : block
    ))
    setMissNext(false) // reset the toggle after each rep
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

  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-brand-brown text-white flex flex-col items-center gap-6 p-6">
        <h1 className="text-2xl font-bold mt-4">Session Summary</h1>
        <div className="text-center">
          <p className="text-6xl font-bold">{successRate}%</p>
          <p className="text-brand-orange mt-1">rewarded</p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-2">
          <div className="flex justify-between py-2 border-b border-white/10"><span>Total reps</span><span>{total}</span></div>
          <div className="flex justify-between py-2 border-b border-white/10"><span>Jackpots</span><span>{jackpots}</span></div>
          <div className="flex justify-between py-2 border-b border-white/10"><span>Missed</span><span>{misses}</span></div>
          <div className="flex justify-between py-2 border-b border-white/10"><span>Blocks</span><span>{blocks.length}</span></div>
        </div>
        <button onClick={startNewSession} className="mt-4 px-6 py-3 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90">
          Start new session
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-brown text-white flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-bold mt-4">Quick Log</h1>

      <div className="text-center">
        <p className="text-6xl font-bold">{total}</p>
        <p className="text-brand-orange mt-1">
          {successRate}% rewarded · {misses} missed · {blocks.length} block{blocks.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Miss toggle — sets whether the NEXT rep is a miss, then you tap a reward */}
      <button
        onClick={() => setMissNext(!missNext)}
        className={`px-6 py-3 rounded-xl border transition ${
          missNext ? 'bg-white text-brand-brown border-white font-bold' : 'border-white/30 active:bg-white/10'
        }`}
      >
        {missNext ? '✓ Miss — pick a reward' : 'Mark as miss'}
      </button>

      <div className="flex gap-3">
        <button onClick={() => logRep('none')} className="px-4 py-4 rounded-xl bg-white/10 active:bg-white/20">No reward</button>
        <button onClick={() => logRep('reward')} className="px-4 py-4 rounded-xl bg-white/20 active:bg-white/30">Reward</button>
        <button onClick={() => logRep('jackpot')} className="px-4 py-4 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90">Jackpot</button>
      </div>

      <div className="flex gap-4 items-center">
        <button onClick={undo} disabled={currentBlock.reps.length === 0} className="text-sm text-white/50 underline disabled:opacity-30">Undo last rep</button>
        <button onClick={newBlock} className="text-sm text-brand-orange underline">+ New block</button>
        <button onClick={() => setView('summary')} disabled={total === 0} className="text-sm text-white underline disabled:opacity-30">End session</button>
      </div>

      <div className="w-full max-w-xs mt-2 flex flex-col gap-4">
        {blocks.slice().reverse().map((block) => (
          <div key={block.id}>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Block {block.id} · {block.reps.length} reps</p>
            {block.reps.slice().reverse().map((rep) => (
              <div key={rep.id} className="flex justify-between py-2 border-b border-white/10 text-sm">
                <span>Rep {rep.id}{rep.missed && ' · miss'}</span>
                <span className="text-brand-orange">{rep.reward}</span>
              </div>
            ))}
            {block.reps.length === 0 && <p className="text-white/30 text-sm py-2">No reps yet</p>}
          </div>
        ))}
      </div>
    </div>
  )
}