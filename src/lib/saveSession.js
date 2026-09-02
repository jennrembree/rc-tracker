import { supabase } from './supabase'

// Saves a full in-memory session (blocks → reps) to the database, nested.
// Returns { error } — null on success.
export async function saveSession(blocks, { dogId, obstacle }) {
  // 1. Who's logged in (to stamp ownership)?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'Not logged in' } }

  // 2. Insert the session, ask for the new row back so we get its id.
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, dog_id: dogId, obstacle })
    .select()
    .single()
  if (sErr) return { error: sErr }

  // 3. For each block: insert it under the session, then insert its reps under the block.
  for (const [i, block] of blocks.entries()) {
    const { data: savedBlock, error: bErr } = await supabase
      .from('blocks')
      .insert({ user_id: user.id, session_id: session.id, position: i + 1 })
      .select()
      .single()
    if (bErr) return { error: bErr }

    if (block.reps.length > 0) {
      const repsToSave = block.reps.map((rep, j) => ({
        user_id: user.id,
        block_id: savedBlock.id,
        position: j + 1,
        reward_given: rep.reward,
        missed: rep.missed || false,
      }))
      const { error: rErr } = await supabase.from('reps').insert(repsToSave)
      if (rErr) return { error: rErr }
    }
  }

  return { error: null }
}