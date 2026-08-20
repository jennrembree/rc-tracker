import { useRef, useState } from 'react'

export const EMPTY_PAWS = { FR: null, FL: null, HR: null, HL: null }

const PAW_IDS = ['FR', 'FL', 'HR', 'HL']
const CANVAS_W = 200
const CANVAS_H = 310

function clientToSvg(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * CANVAS_W
  const y = ((clientY - rect.top) / rect.height) * CANVAS_H
  const inside = x >= 0 && x <= CANVAS_W && y >= 0 && y <= CANVAS_H
  return {
    x: Math.min(CANVAS_W, Math.max(0, x)),
    y: Math.min(CANVAS_H, Math.max(0, y)),
    inside,
  }
}

function TrayPaw({ label }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-brand-brown text-xs font-bold border-[3px] border-brand-orange select-none">
      {label}
    </span>
  )
}

export default function ZoneDiagram({ paws, onPawsChange }) {
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const [drag, setDrag] = useState(null)

  function startDrag(id, e) {
    e.preventDefault()
    e.stopPropagation()
    // Capture must stay on this same DOM node for the whole gesture —
    // do not unmount it until pointerup, or move events will stop.
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y, inside } = clientToSvg(svgRef.current, e.clientX, e.clientY)
    const next = {
      id,
      pointerId: e.pointerId,
      origin: paws[id],
      preview: { x: e.clientX, y: e.clientY },
      overSvg: inside,
      svgPos: inside ? { x, y } : paws[id],
    }
    dragRef.current = next
    setDrag(next)
  }

  function onPointerMove(e) {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    const { x, y, inside } = clientToSvg(svgRef.current, e.clientX, e.clientY)
    const next = {
      ...d,
      preview: { x: e.clientX, y: e.clientY },
      overSvg: inside,
      svgPos: inside ? { x, y } : d.svgPos,
    }
    dragRef.current = next
    setDrag(next)
  }

  function endDrag(e) {
    const d = dragRef.current
    if (!d || (e.pointerId != null && e.pointerId !== d.pointerId)) return
    const { x, y, inside } = clientToSvg(svgRef.current, e.clientX, e.clientY)
    onPawsChange({
      ...paws,
      [d.id]: inside ? { x, y } : d.origin,
    })
    dragRef.current = null
    setDrag(null)
  }

  function posFor(id) {
    if (drag?.id === id) {
      if (drag.overSvg && drag.svgPos) return drag.svgPos
      return drag.origin
    }
    return paws[id]
  }

  const dragHandlers = (id) => ({
    onPointerDown: (e) => startDrag(id, e),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  })

  return (
    <div className="flex flex-col items-center py-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-40 h-60 touch-none"
        role="img"
        aria-label="Contact zone diagram — drag paws from the tray to place them"
      >
        <rect x="20" y="10" width="160" height="240" rx="4" fill="none" stroke="#6ba3d6" strokeWidth="4" />
        <rect x="20" y="120" width="160" height="130" fill="none" stroke="#b8621a" strokeWidth="4" />
        <rect x="20" y="152.5" width="160" height="97.5" fill="none" stroke="#4caf50" strokeWidth="3" />
        <rect x="20" y="164.7" width="160" height="85.3" fill="#4caf50" fillOpacity="0.35" stroke="#4caf50" strokeWidth="1" />

        {/* Ground just past the end of the contact — for a paw landed after the plank */}
        <rect x="20" y="256" width="160" height="48" rx="4"
          fill="#ffffff" fillOpacity="0.06" stroke="#ffffff" strokeOpacity="0.25"
          strokeWidth="2" strokeDasharray="4 4" />
        <text x="100" y="284" textAnchor="middle" fontSize="9" fill="#ffffff" fillOpacity="0.5"
          className="select-none pointer-events-none">ground</text>

        {PAW_IDS.map((id) => {
          const pos = posFor(id)
          if (!pos) return null
          const hideWhileGhost = drag?.id === id && !drag.overSvg
          return (
            <g
              key={id}
              transform={`translate(${pos.x}, ${pos.y})`}
              opacity={hideWhileGhost ? 0 : 1}
            >
              <circle
                r="14"
                fill="white"
                stroke="#b8621a"
                strokeWidth="3"
                className="cursor-grab touch-none"
                style={{ touchAction: 'none' }}
                {...dragHandlers(id)}
              />
              <text
                textAnchor="middle"
                dy="4"
                fontSize="9"
                fontWeight="bold"
                fill="#3b322f"
                className="select-none pointer-events-none"
              >
                {id}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex justify-center gap-2 mt-3" aria-label="Paw tray">
        {PAW_IDS.map((id) => {
          const unplaced = paws[id] == null
          const draggingThis = drag?.id === id
          return (
            <div key={id} className="w-9 h-9 flex items-center justify-center">
              {unplaced ? (
                <button
                  type="button"
                  aria-label={`Place ${id} paw`}
                  className={`cursor-grab touch-none active:cursor-grabbing ${draggingThis ? 'opacity-0' : ''}`}
                  style={{ touchAction: 'none' }}
                  {...dragHandlers(id)}
                >
                  <TrayPaw label={id} />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full border border-dashed border-white/25" />
              )}
            </div>
          )
        })}
      </div>

      {drag && !drag.overSvg && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: drag.preview.x,
            top: drag.preview.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <TrayPaw label={drag.id} />
        </div>
      )}
    </div>
  )
}
