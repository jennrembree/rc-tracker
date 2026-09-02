import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SessionHistory({ onBack }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    // Pull sessions, and for each, also pull its blocks and their reps —
    // so we can count reps. The nested select does the joining for us.
    const { data, error } = await supabase
      .from('sessions')
      .select('id, date, obstacle, blocks(reps(reward_given, missed))')
      .order('created_at', { ascending: false })
      
    if (error) {
      setError(error.message)
    } else {
      setSessions(data)
    }
    setLoading(false)
  }

  // Flatten a session's nested blocks→reps into a flat rep list, then compute stats.
  function statsFor(session) {
    const reps = (session.blocks || []).flatMap((b) => b.reps || [])
    const total = reps.length
    const rewarded = reps.filter((r) => r.reward_given !== 'none').length
    const successRate = total === 0 ? 0 : Math.round((rewarded / total) * 100)
    return { total, successRate }
  }

  return (
    <div className="h-screen bg-black flex justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col overflow-hidden bg-brand-brown text-white">
        <header className="p-4 flex items-center gap-3 border-b border-white/10">
          <button onClick={onBack} className="text-brand-orange text-sm underline">← Back</button>
          <h1 className="text-xl font-bold">Past sessions</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loading && <p className="text-white/50 text-sm">Loading…</p>}
          {error && <p className="text-brand-orange text-sm">Error: {error}</p>}
          {!loading && !error && sessions.length === 0 && (
            <p className="text-white/40 text-sm">No sessions yet — log one and end it to see it here.</p>
          )}

          {sessions.map((session) => {
            const { total, successRate } = statsFor(session)
            return (
              <div key={session.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold capitalize">{session.obstacle}</span>
                  <span className="text-white/50 text-sm">{session.date}</span>
                </div>
                <p className="text-brand-orange text-sm mt-1">
                  {total} reps · {successRate}% rewarded
                </p>
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}