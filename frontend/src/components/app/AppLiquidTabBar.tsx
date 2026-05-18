import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'

export type AppLiquidTab = {
  key: string
  title: string
  icon: ReactNode
}

type AppLiquidTabBarProps = {
  activeKey: string
  onChange: (key: string) => void
  tabs: AppLiquidTab[]
}

type DragState = {
  dragging: boolean
  pointerId: number
  startPosition: number
  startX: number
  startY: number
}

const DRAG_LOCK_DISTANCE = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function AppLiquidTabBar({ activeKey, onChange, tabs }: AppLiquidTabBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [trackWidth, setTrackWidth] = useState(0)

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === activeKey)
  )
  const segmentWidth = trackWidth > 0 ? trackWidth / tabs.length : 0
  const maxPosition = segmentWidth * Math.max(0, tabs.length - 1)
  const restingPosition = segmentWidth * activeIndex
  const visualPosition = dragPosition ?? restingPosition
  const normalizedPosition = segmentWidth > 0 ? visualPosition / segmentWidth : activeIndex

  useEffect(() => {
    const trackElement = trackRef.current
    if (!trackElement) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0
      setTrackWidth(nextWidth)
    })

    resizeObserver.observe(trackElement)
    setTrackWidth(trackElement.getBoundingClientRect().width)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  function clearDragState() {
    dragStateRef.current = null
    setDragPosition(null)
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  function settleDrag(position: number, shouldNavigate: boolean) {
    if (segmentWidth <= 0) {
      clearDragState()
      return
    }

    const nextIndex = clamp(Math.round(position / segmentWidth), 0, tabs.length - 1)
    const nextKey = tabs[nextIndex]?.key

    clearDragState()

    if (shouldNavigate && nextKey && nextKey !== activeKey) {
      onChange(nextKey)
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (tabs.length <= 1 || segmentWidth <= 0) {
      return
    }

    dragStateRef.current = {
      dragging: false,
      pointerId: event.pointerId,
      startPosition: visualPosition,
      startX: event.clientX,
      startY: event.clientY
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId || segmentWidth <= 0) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY

    if (!dragState.dragging) {
      if (Math.abs(deltaX) < DRAG_LOCK_DISTANCE) {
        return
      }

      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return
      }

      dragState.dragging = true
      suppressClickRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    event.preventDefault()
    setDragPosition(clamp(dragState.startPosition + deltaX, 0, maxPosition))
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    const nextPosition = dragPosition ?? restingPosition
    settleDrag(nextPosition, dragState.dragging)
  }

  function handlePointerCancel() {
    clearDragState()
  }

  const thumbStyle: CSSProperties =
    segmentWidth > 0
      ? {
          transform: `translate3d(${visualPosition}px, 0, 0)`,
          width: `${segmentWidth}px`
        }
      : {
          width: `${100 / tabs.length}%`
        }

  return (
    <div className="app-tabbar">
      <div className="app-page-inner app-tabbar__shell">
        <div className="app-tabbar__rail">
          <div
            ref={trackRef}
            className={
              dragStateRef.current?.dragging ? 'app-tabbar__track app-tabbar__track--dragging' : 'app-tabbar__track'
            }
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            role="tablist"
            aria-label="主导航"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
          >
            <div className="app-tabbar__thumb" style={thumbStyle} />
            {tabs.map((tab, index) => {
              const focus = Math.max(0, 1 - Math.abs(normalizedPosition - index))

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={tab.key === activeKey}
                  className="app-tabbar__tab"
                  style={{ '--tab-focus': focus.toFixed(3) } as CSSProperties}
                  onClick={() => {
                    if (suppressClickRef.current || tab.key === activeKey) {
                      return
                    }

                    onChange(tab.key)
                  }}
                >
                  <span className="app-tabbar__tab-content">
                    <span className="app-tabbar__tab-icon">{tab.icon}</span>
                    <span className="app-tabbar__tab-title">{tab.title}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
