import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  async function signUp() {
    setStatus('Signing up…')
    const { error } = await supabase.auth.signUp({ email, password })
    setStatus(error ? 'Sign up error: ' + error.message : 'Signed up! You are logged in.')
  }

  async function logIn() {
    setStatus('Logging in…')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setStatus(error ? 'Login error: ' + error.message : 'Logged in!')
  }

  return (
    <div className="min-h-screen bg-brand-brown text-white flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="px-3 py-2 rounded-lg w-64 bg-white text-brand-brown placeholder-brand-brown/50 border-2 border-brand-orange"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        className="px-3 py-2 rounded-lg w-64 bg-white text-brand-brown placeholder-brand-brown/50 border-2 border-brand-orange"
      />

      <div className="flex gap-3">
        <button onClick={logIn} className="px-4 py-2 rounded-lg bg-white/20 active:bg-white/30">Log in</button>
        <button onClick={signUp} className="px-4 py-2 rounded-lg bg-brand-orange text-brand-brown font-bold">Sign up</button>
      </div>

      {status && <p className="text-sm text-brand-orange text-center">{status}</p>}
    </div>
  )
}