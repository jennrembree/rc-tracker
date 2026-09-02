import StartSession from './components/StartSession'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import ZoneDiagram, { EMPTY_PAWS } from './components/ZoneDiagram'
import CriteriaEditor from './components/CriteriaEditor'
import AuthTest from './components/AuthTest'
import DogsTest from './components/DogsTest'
import { saveSession } from './lib/saveSession'
import SessionHistory from './components/SessionHistory'


export default function App() {
  // ── AUTH GATE (new) ─────────────────────────────
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // On startup: ask if someone's already logged in.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    // Then listen for any login/logout while the app is open.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function logOut() {
    await supabase.auth.signOut()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-brown text-white flex items-center justify-center">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <AuthTest />
  }
  // ── END AUTH GATE — below here only runs when logged in ──

  return <LoggingApp onLogOut={logOut} userEmail={session.user.email} />
}

// Your existing app, now a logged-in-only component.
function LoggingApp({ onLogOut, userEmail }) {
  const [blocks, setBlocks] = useState([{ id: 1, reps: [] }])
  const [view, setView] = useState('start')
  const [missNext, setMissNext] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null) // { dogId, obstacle } once a session starts  
  const [selected, setSelected] = useState(null)
  const [currentPaws, setCurrentPaws] = useState(EMPTY_PAWS)

  const currentBlock = blocks[blocks.length - 1]
  const isEditing = selected !== null

  const [dogId, setDogId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  



  function logRep(reward) {
    if (isEditing) {
      setBlocks(blocks.map((block) =>
        block.id === selected.blockId
          ? { ...block, reps: block.reps.map((rep) =>
              rep.id === selected.repId ? { ...rep, reward, paws: currentPaws } : rep) }
          : block
      ))
      return
    }
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id
        ? { ...block, reps: [...block.reps, { id: block.reps.length + 1, reward, missed: missNext, paws: currentPaws }] }
        : block
    ))
    setMissNext(false)
    setCurrentPaws(EMPTY_PAWS)
  }

  function selectRep(blockId, repId) {
    const block = blocks.find((b) => b.id === blockId)
    const rep = block.reps.find((r) => r.id === repId)
    setSelected({ blockId, repId })
    setCurrentPaws(rep.paws || EMPTY_PAWS)
  }

  function deselect() {
    setSelected(null)
    setCurrentPaws(EMPTY_PAWS)
  }

  function undo() {
    setBlocks(blocks.map((block) =>
      block.id === currentBlock.id ? { ...block, reps: block.reps.slice(0, -1) } : block
    ))
  }

  function newBlock() {
    setBlocks([...blocks, { id: blocks.length + 1, reps: [] }])
  }

  function startNewSession() {
    setBlocks([{ id: 1, reps: [] }])
    setMissNext(false)
    setSelected(null)
    setCurrentPaws(EMPTY_PAWS)
    setView('start')
  }

  const allReps = blocks.flatMap((b) => b.reps)
  const total = allReps.length
  const rewarded = allReps.filter((r) => r.reward !== 'none').length
  const misses = allReps.filter((r) => r.missed).length
  const jackpots = allReps.filter((r) => r.reward === 'jackpot').length
  const successRate = total === 0 ? 0 : Math.round((rewarded / total) * 100)

  const Frame = ({ children }) => (
    <div className="h-screen bg-black flex justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col overflow-hidden bg-brand-brown text-white">
        {children}
      </div>
    </div>
  )

  if (view === 'start') {
    return (
      <StartSession
        onStart={(info) => {
          setSessionInfo(info)
          setBlocks([{ id: 1, reps: [] }]) // fresh session
          setView('logging')
        }}
      />
    )
  }

  if (view === 'criteria') {
    return <CriteriaEditor onBack={() => setView('logging')} />
  }

  if (view === 'dogs') {
    return <DogsTest onBack={() => setView('logging')} />
  }

  if (view === 'history') {
    return <SessionHistory onBack={() => setView('logging')} />
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

  return (
    <Frame>
      <header className="p-4 text-center border-b border-white/10">
        <h1 className="text-xl font-bold">
          {isEditing ? `Editing block ${selected.blockId} · rep ${selected.repId}` : 'Quick Log'}
        </h1>
        <p className="text-brand-orange text-sm mt-1">
          {isEditing ? 'Paws and reward update this rep' : `${total} reps · ${successRate}% rewarded · ${misses} missed`}
        </p>
        <div className="flex justify-center gap-3 mt-1">
          <button onClick={() => setView('criteria')} className="text-brand-orange text-xs underline">Criteria (temp)</button>
          <button onClick={() => setView('dogs')} className="text-brand-orange text-xs underline">Dogs (temp)</button>
          <button onClick={onLogOut} className="text-white/50 text-xs underline">Log out ({userEmail})</button>
          <button onClick={() => setView('history')} className="text-brand-orange text-xs underline">History (temp)</button>
        </div>
        {saveStatus && <p className="text-brand-orange text-xs mt-1">{saveStatus}</p>}
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <ZoneDiagram paws={currentPaws} onPawsChange={setCurrentPaws} />
        {blocks.slice().reverse().map((block) => (
          <div key={block.id}>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Block {block.id} · {block.reps.length} reps</p>
            {block.reps.slice().reverse().map((rep) => {
              const isSel = selected && selected.blockId === block.id && selected.repId === rep.id
              return (
                <button
                  key={rep.id}
                  onClick={() => selectRep(block.id, rep.id)}
                  aria-pressed={isSel}
                  className={`flex justify-between py-2 border-b border-white/10 text-sm w-full text-left ${isSel ? 'bg-white/10' : ''}`}
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

      <footer className="p-4 border-t border-white/10 flex flex-col gap-3">
        {isEditing && (
          <button onClick={deselect} className="w-full py-2.5 rounded-xl bg-white text-brand-brown font-bold text-sm">
            Done editing — new rep
          </button>
        )}
        {!isEditing && (
          <button
            onClick={() => setMissNext(!missNext)}
            className={`w-full py-2.5 rounded-xl border text-sm transition ${missNext ? 'bg-white text-brand-brown border-white font-bold' : 'border-white/30 active:bg-white/10'}`}
          >
            {missNext ? '✓ Miss — now pick a reward' : 'Mark as miss'}
          </button>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => logRep('none')} className="py-5 rounded-xl bg-white/10 active:bg-white/20 text-sm">No reward</button>
          <button onClick={() => logRep('reward')} className="py-5 rounded-xl bg-white/20 active:bg-white/30 text-sm">Reward</button>
          <button onClick={() => logRep('jackpot')} className="py-5 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90 text-sm">Jackpot</button>
        </div>
        {!isEditing && (
          <div className="flex justify-between text-sm pt-1">
            <button onClick={undo} disabled={currentBlock.reps.length === 0} className="text-white/50 underline disabled:opacity-30">Undo</button>
            <button onClick={newBlock} className="text-brand-orange underline">+ New block</button>
            <button
              onClick={async () => {
                setSaveStatus('Saving…')
                const { error } = await saveSession(blocks, sessionInfo)
                if (error) { setSaveStatus('Save error: ' + error.message); return }
                setSaveStatus('')
                setView('summary')
              }}
              disabled={total === 0}
              className="text-white underline disabled:opacity-30"
            >
              End session
            </button>
          </div>
        )}
      </footer>
    </Frame>
  )
}