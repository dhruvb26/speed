'use client'

import { useRef, useState, useEffect } from 'react'
import { useAnimationFrame } from 'motion/react'
import { useRouter } from 'next/navigation'

import { useMousePositionRef } from '@/hooks/use-mouse-position-ref'
import VariableFontAndCursor from '@/components/ui/variable-font-and-cursor'
import StatusDisplay from '@/components/global/status-display'
import { useAuth } from '@clerk/nextjs'

export default function Preview() {
  const { isSignedIn } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const router = useRouter()

  const positionRef = useMousePositionRef(
    containerRef as React.RefObject<HTMLElement>
  )

  useAnimationFrame(() => {
    const newX = positionRef.current?.x || 0
    const newY = positionRef.current?.y || 0
    setCoordinates({ x: newX, y: newY })
  })

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        setIsHoveringButton(true)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        // Check if we're actually leaving the button element
        const relatedTarget = e.relatedTarget as HTMLElement
        if (
          !relatedTarget ||
          (!relatedTarget.closest('button') &&
            relatedTarget.tagName !== 'BUTTON')
        ) {
          setIsHoveringButton(false)
        }
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  const { x, y } = coordinates

  const handleGetStartedClick = () => {
    if (isSignedIn) {
      router.push('/chat')
    } else {
      router.push('/sign-in')
    }
  }

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden relative ${!isHoveringButton ? 'cursor-none' : ''}`}
      ref={containerRef}
    >
      <div className="flex items-center justify-center flex-1 bg-background relative overflow-hidden">
        <div className="w-full h-full items-center justify-center flex">
          <VariableFontAndCursor
            label="speed"
            hoverLabel="get started"
            className="text-5xl sm:text-7xl md:text-7xl text-foreground hover:cursor-none"
            fontVariationMapping={{
              y: { name: 'wght', min: 400, max: 600 },
              x: { name: 'slnt', min: 0, max: -10 },
            }}
            containerRef={containerRef as React.RefObject<HTMLDivElement>}
            onClick={handleGetStartedClick}
          />
        </div>

        <StatusDisplay x={x} y={y} />
      </div>

      {!isHoveringButton && (
        <>
          <div
            className="fixed w-px h-full bg-foreground/20 dark:bg-foreground top-0 -translate-x-1/2 pointer-events-none z-50"
            style={{
              left: `${x}px`,
            }}
          />
          <div
            className="fixed w-full h-px bg-foreground/20 dark:bg-foreground left-0 -translate-y-1/2 pointer-events-none z-50"
            style={{
              top: `${y}px`,
            }}
          />
          <div
            className="fixed w-2 h-2 bg-foreground -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-50"
            style={{
              top: `${y}px`,
              left: `${x}px`,
            }}
          />
        </>
      )}
    </div>
  )
}
