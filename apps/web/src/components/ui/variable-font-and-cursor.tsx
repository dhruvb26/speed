'use client'

import React, { useCallback, useRef, useState } from 'react'
import { motion, useAnimationFrame, AnimatePresence } from 'motion/react'

import { useMousePositionRef } from '@/hooks/use-mouse-position-ref'

interface FontVariationAxis {
  name: string
  min: number
  max: number
}

interface FontVariationMapping {
  x: FontVariationAxis
  y: FontVariationAxis
}

interface TextProps {
  label: string
  hoverLabel?: string
  fontVariationMapping: FontVariationMapping
  containerRef: React.RefObject<HTMLDivElement>
  className?: string
  onClick?: () => void
}

const VariableFontAndCursor = ({
  label,
  hoverLabel,
  fontVariationMapping,
  className,
  containerRef,
  onClick,
  ...props
}: TextProps) => {
  const mousePositionRef = useMousePositionRef(containerRef)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const interpolateFontVariationSettings = useCallback(
    (xPosition: number, yPosition: number) => {
      const container = containerRef.current
      if (!container) return '0 0'

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const xProgress = Math.min(Math.max(xPosition / containerWidth, 0), 1)
      const yProgress = Math.min(Math.max(yPosition / containerHeight, 0), 1)

      const xValue =
        fontVariationMapping.x.min +
        (fontVariationMapping.x.max - fontVariationMapping.x.min) * xProgress
      const yValue =
        fontVariationMapping.y.min +
        (fontVariationMapping.y.max - fontVariationMapping.y.min) * yProgress

      return `'${fontVariationMapping.x.name}' ${xValue}, '${fontVariationMapping.y.name}' ${yValue}`
    },
    [
      containerRef,
      fontVariationMapping.x.min,
      fontVariationMapping.x.max,
      fontVariationMapping.x.name,
      fontVariationMapping.y.min,
      fontVariationMapping.y.max,
      fontVariationMapping.y.name,
    ]
  )

  useAnimationFrame(() => {
    const settings = interpolateFontVariationSettings(
      mousePositionRef.current.x,
      mousePositionRef.current.y
    )
    if (spanRef.current) {
      spanRef.current.style.fontVariationSettings = settings
    }
  })

  const displayText = isHovered && hoverLabel ? hoverLabel : label

  return (
    <motion.span
      ref={spanRef}
      className={`${className} inline-block cursor-pointer relative`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={displayText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          className="block"
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

export default VariableFontAndCursor
