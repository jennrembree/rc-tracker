import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DogsTest() {
  const [dogs, setDogs] = useState([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')

  // Load all dogs from the database when the screen first appears.
  async function loadDogs() {
    const { data, error } = await supabase.from('dogs').select('*').order('created_at')
    if (error) setStatus('Load error: ' + error.message)
    else setDogs(data)
  }

  useEffect(() => {
    loadDogs()
  }, [])

  // Save a new dog to the database, then reload the list.
  async function addDog() {
    if (!name.trim()) return
    setStatus('Saving…')
    const { error } = await supabase.from('dogs').insert({ name: name.trim() })
    if (error) {
      setStatus('Save error: ' + error.message)
    } else {
      setName('')
      setStatus('Saved!')
      loadDogs()
    }
  }

  return (
    <div className="min-h-screen bg-brand-brown text-white flex flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Dogs (database test)</h1>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dog's name"
          className="px-3 py-2 rounded-lg text-brand-brown"
        />
        <button onClick={addDog} className="px-4 py-2 rounded-lg bg-brand-orange text-brand-brown font-bold">
          Add
        </button>
      </div>

      {status && <p className="text-sm text-brand-orange">{status}</p>}

      <div className="w-full max-w-xs mt-2">
        {dogs.map((dog) => (
          <div key={dog.id} className="py-2 border-b border-white/10">{dog.name}</div>
        ))}
        {dogs.length === 0 && <p className="text-white/40 text-sm">No dogs yet</p>}
      </div>
    </div>
  )
}