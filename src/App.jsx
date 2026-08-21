import DogsTest from './components/DogsTest'

import { useState } from 'react'

import ZoneDiagram, { EMPTY_PAWS } from './components/ZoneDiagram'

import CriteriaEditor from './components/CriteriaEditor'

function clonePaws(paws) {
  return {
    FR: paws?.FR ?? null,
    FL: paws?.FL ?? null,
    HR: paws?.HR ?? null,
    HL: paws?.HL ?? null,
  }
}

export default function App() {
  return <DogsTest />
  const [blocks, setBlocks] = useState([{ id: 1, reps: [] }])
  const [view, setView] = useState('logging')
  const [missNext, setMissNext] = useState(false)
  const [paws, setPaws] = useState(clonePaws(EMPTY_PAWS))
  const [selected, setSelected] = useState(null) // { blockId, repId } | null — null = new in-progress rep

  const currentBlock = blocks[blocks.length - 1]
  const isEditing = selected != null

  function findRep(blockId, repId) {
    const block = blocks.find((b) => b.id === blockId)
    return block?.reps.find((r) => r.id === repId)
  }

  function patchRep(blockId, repId, patch) {
    setBlocks(blocks.map((block) =>
      block.id === blockId
        ? { ...block, reps: block.reps.map((rep) => (rep.id === repId ? { ...rep, ...patch } : rep)) }
        : block
    ))
  }

  function updatePaws(next) {
    setPaws(next)
    if (selected) {
      patchRep(selected.blockId, selected.repId, { paws: clonePaws(next) })
    }
  }

  function logRep(reward) {
    if (selected) {
      patchRep(selected.blockId, selected.repId, { reward, missed: missNext })
      setMissNext(false)
      return
    }

    const newId = currentBlock.reps.length + 1
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? {
            ...block,
            reps: [...block.reps, {
              id: newId,
              reward,
              missed: missNext,
              paws: clonePaws(paws),
            }],
          }
        : block
    ))
    setPaws(clonePaws(EMPTY_PAWS))
    setMissNext(false)
  }

  function selectRep(blockId, repId) {
    const rep = findRep(blockId, repId)
    if (!rep) return
    setSelected({ blockId, repId })
    setPaws(clonePaws(rep.paws ?? EMPTY_PAWS))
    setMissNext(rep.missed)
  }

  function doneEditing() {
    setSelected(null)
    setPaws(clonePaws(EMPTY_PAWS))
    setMissNext(false)
  }

  function undo() {
    const last = currentBlock.reps[currentBlock.reps.length - 1]
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? { ...block, reps: block.reps.slice(0, -1) }
        : block
    ))
    if (selected && last && selected.blockId === currentBlock.id && selected.repId === last.id) {
      doneEditing()
    }
  }

  function newBlock() {
    setBlocks([...blocks, { id: blocks.length + 1, reps: [] }])
  }

  function startNewSession() {
    setBlocks([{ id: 1, reps: [] }])
    setMissNext(false)
    setPaws(clonePaws(EMPTY_PAWS))
    setSelected(null)
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
  if (view === 'criteria') {
    return <CriteriaEditor onBack={() => setView('logging')} />
  }

  
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
        <h1 className="text-xl font-bold">
          {isEditing ? `Editing block ${selected.blockId} · rep ${selected.repId}` : 'Quick Log'}
        </h1>
        <p className="text-brand-orange text-sm mt-1">
          {isEditing
            ? 'Paws and reward update this rep'
            : `${total} reps · ${successRate}% rewarded · ${misses} missed`}
        </p>
        <button onClick={() => setView('criteria')} className="text-brand-orange text-xs underline block mx-auto mt-1">
          Criteria (temp)
        </button>
      </header>

      {/* Scrolling middle — the rep list (the zone diagram will live here next) */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <ZoneDiagram paws={paws} onPawsChange={updatePaws} />
        {blocks.slice().reverse().map((block) => (
          <div key={block.id}>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
              Block {block.id} · {block.reps.length} reps
            </p>
            {block.reps.slice().reverse().map((rep) => {
              const isSelected = selected?.blockId === block.id && selected?.repId === rep.id
              return (
                <button
                onClick={() => selectRep(block.id, rep.id)}
                aria-pressed={isSelected}
                className={`flex justify-between py-2 border-b border-white/10 text-sm w-full text-left ${
                    isSelected ? 'bg-white/15 border-l-4 border-l-brand-orange pl-3' : 'active:bg-white/5'
                  }`}
                >
                  <span>Rep {rep.id}{rep.missed && ' · miss'}</span>
                  <span className="text-brand-orange">{rep.reward}</span>
                </button>
              )
            })}
            {block.reps.length === 0 && <p className="text-white/30 text-sm py-2">No reps yet</p>}
          </div>
        ))}
      </main>

      {/* Fixed bottom controls — thumb zone */}
      <footer className="p-4 border-t border-white/10 flex flex-col gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={doneEditing}
            className="w-full py-2.5 rounded-xl bg-brand-orange text-brand-brown font-bold text-sm active:brightness-90"
          >
            Done editing — new rep
          </button>
        )}

        <button
          onClick={() => setMissNext(!missNext)}
          className={`w-full py-2.5 rounded-xl border text-sm transition ${
            missNext ? 'bg-white text-brand-brown border-white font-bold' : 'border-white/30 active:bg-white/10'
          }`}
        >
          {missNext ? '✓ Miss — now pick a reward' : 'Mark as miss'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => logRep('none')} className="py-5 rounded-xl bg-white/10 active:bg-white/20 text-sm">
            {isEditing ? 'Set no reward' : 'No reward'}
          </button>
          <button onClick={() => logRep('reward')} className="py-5 rounded-xl bg-white/20 active:bg-white/30 text-sm">
            {isEditing ? 'Set reward' : 'Reward'}
          </button>
          <button onClick={() => logRep('jackpot')} className="py-5 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90 text-sm">
            {isEditing ? 'Set jackpot' : 'Jackpot'}
          </button>
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
