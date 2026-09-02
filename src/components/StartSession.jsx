import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StartSession({ onStart }) {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [dogId, setDogId] = useState(null)
  const [obstacle, setObstacle] = useState('dogwalk')

  useEffect(() => {
    supabase.from('dogs').select('id, name').order('created_at').then(({ data }) => {
      setDogs(data || [])
      if (data && data.length > 0) setDogId(data[0].id)
      setLoading(false)
    })
  }, [])

  return (
    <div className="h-screen bg-black flex justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col overflow-hidden bg-brand-brown text-white">
        <header className="p-4 text-center border-b border-white/10">
          <h1 className="text-xl font-bold">Start a session</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {loading && <p className="text-white/50 text-sm">Loading dogs…</p>}

          {!loading && dogs.length === 0 && (
            <p className="text-white/50 text-sm">No dogs yet. Add one on the Dogs screen first.</p>
          )}

          {!loading && dogs.length > 0 && (
            <>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Dog</p>
                <div className="flex flex-col gap-2">
                  {dogs.map((dog) => (
                    <button
                      key={dog.id}
                      onClick={() => setDogId(dog.id)}
                      className={`py-3 px-4 rounded-xl text-left border-2 transition ${
                        dogId === dog.id
                          ? 'bg-brand-orange text-brand-brown border-brand-orange font-bold'
                          : 'bg-white/5 border-white/15'
                      }`}
                    >
                      {dog.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Obstacle</p>
                <div className="grid grid-cols-2 gap-2">
                  {['dogwalk', 'aframe'].map((obs) => (
                    <button
                      key={obs}
                      onClick={() => setObstacle(obs)}
                      className={`py-3 rounded-xl border-2 capitalize transition ${
                        obstacle === obs
                          ? 'bg-brand-orange text-brand-brown border-brand-orange font-bold'
                          : 'bg-white/5 border-white/15'
                      }`}
                    >
                      {obs === 'aframe' ? 'A-frame' : 'Dogwalk'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="p-4 border-t border-white/10">
          <button
            onClick={() => onStart({ dogId, obstacle })}
            disabled={!dogId}
            className="w-full py-4 rounded-xl bg-brand-orange text-brand-brown font-bold active:brightness-90 disabled:opacity-30"
          >
            Start logging
          </button>
        </footer>
      </div>
    </div>
  )
}