import { useRef, useState } from 'react'

const CANVAS_W = 200
const CANVAS_H = 310

// The contact geometry (matches ZoneDiagram): target spans the bottom 3/4 of the contact.
const TARGET_TOP = 152.5
const TARGET_BOTTOM = 250
const TARGET_HEIGHT = TARGET_BOTTOM - TARGET_TOP // 97.5

const PAW_IDS = ['FR', 'FL', 'HR', 'HL']

export default function CriteriaEditor({ onBack }) {
  const svgRef = useRef(null)
  const dragRef = useRef(false)
  // Rewardable band = from this Y down to the target bottom. Start at bottom 7/8 of target.
  const [boundaryY, setBoundaryY] = useState(TARGET_TOP + TARGET_HEIGHT * (1 / 8))
  const [activePaws, setActivePaws] = useState(['HR', 'HL']) // which feet count; hind by default

  function togglePaw(id) {
    setActivePaws((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id]
    )
  }

  function clientToSvgY(clientY) {
    const rect = svgRef.current.getBoundingClientRect()
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H
    return Math.min(TARGET_BOTTOM, Math.max(TARGET_TOP, y))
  }

  function startDrag(e) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = true
    setBoundaryY(clientToSvgY(e.clientY))
  }
  function onMove(e) {
    if (!dragRef.current) return
    setBoundaryY(clientToSvgY(e.clientY))
  }
  function endDrag() {
    dragRef.current = false
  }

  // The proportion that actually gets stored: how much of the target is rewardable, from the bottom.
  const rewardablePct = Math.round(((TARGET_BOTTOM - boundaryY) / TARGET_HEIGHT) * 100)

  // Read the current settings back as a plain-English sentence.
  function criteriaSentence() {
    if (activePaws.length === 0) {
      return 'No feet selected — nothing counts as rewardable yet.'
    }
    const hind = activePaws.filter((p) => p === 'HR' || p === 'HL')
    const front = activePaws.filter((p) => p === 'FR' || p === 'FL')

    const parts = []
    if (hind.length) parts.push(`${hind.length === 2 ? 'either' : 'a'} hind foot`)
    if (front.length) parts.push(`${front.length === 2 ? 'either' : 'a'} front foot`)
    const feet = parts.join(' or ')

    return `Reward: ${feet} landing in the bottom ${rewardablePct}% of the target.`
  }

  return (
    <div className="h-screen bg-black flex justify-center">
      <div className="w-full max-w-sm h-screen flex flex-col overflow-hidden bg-brand-brown text-white">
        <header className="p-4 flex items-center gap-3 border-b border-white/10">
          <button onClick={onBack} className="text-brand-orange text-sm underline">← Back</button>
          <h1 className="text-xl font-bold">Criteria</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-48 h-72 touch-none"
            role="img"
            aria-label="Criteria — drag the line to set the rewardable band"
          >
            {/* Zone rectangles (same visual language as the logging diagram) */}
            <rect x="20" y="10" width="160" height="240" rx="4" fill="none" stroke="#6ba3d6" strokeWidth="4" />
            <rect x="20" y="120" width="160" height="130" fill="none" stroke="#b8621a" strokeWidth="4" />
            <rect x="20" y="152.5" width="160" height="97.5" fill="none" stroke="#4caf50" strokeWidth="3" />

            {/* Rewardable band — from the boundary down to the target bottom */}
            <rect
              x="20" y={boundaryY} width="160" height={TARGET_BOTTOM - boundaryY}
              fill="#4caf50" fillOpacity="0.35"
            />

            {/* Draggable boundary line + handle */}
            <line x1="20" y1={boundaryY} x2="180" y2={boundaryY} stroke="#ffffff" strokeWidth="3" />
            <circle
              cx="100" cy={boundaryY} r="12"
              fill="#ffffff" stroke="#b8621a" strokeWidth="3"
              className="cursor-grab touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={startDrag}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
            />
          </svg>

          <p className="text-brand-orange text-sm">
            Rewardable: bottom {rewardablePct}% of target
          </p>

          <div className="w-full mt-2">
            <p className="text-white/60 text-xs uppercase tracking-wide mb-2 text-center">Which feet count</p>
            <div className="flex justify-center gap-3">
              {PAW_IDS.map((id) => {
                const on = activePaws.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => togglePaw(id)}
                    aria-pressed={on}
                    className={`w-12 h-12 rounded-full text-sm font-bold border-[3px] transition ${
                      on
                        ? 'bg-brand-orange text-brand-brown border-brand-orange'
                        : 'bg-transparent text-white/50 border-white/25'
                    }`}
                  >
                    {id}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="w-full mt-4 p-3 rounded-xl bg-white/10 border border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">In plain words</p>
            <p className="text-sm leading-relaxed">{criteriaSentence()}</p>
          </div>
        </main>
      </div>
    </div>
  )
}