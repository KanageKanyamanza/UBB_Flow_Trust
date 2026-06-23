import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'xl' | '2xl'
  variant?: 'line' | 'rect' | 'circle'
  style?: React.CSSProperties
}

/**
 * Skeleton component — animated placeholder for loading states.
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <SkeletonCard />
 *   <SkeletonTable rows={5} cols={4} />
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'rect',
  style,
}: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }

  const variantDefaults: Record<string, string> = {
    line: 'h-4',
    rect: 'h-16',
    circle: 'h-10 w-10 rounded-full',
  }

  return (
    <div
      className={`
        animate-pulse bg-white/5 border border-white/[0.05]
        ${variant === 'circle' ? 'rounded-full' : roundedMap[rounded]}
        ${variantDefaults[variant] || ''}
        ${className}
      `}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/** Pre-built KPI card skeleton */
export function SkeletonKpiCard() {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-9 w-9" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Pre-built table skeleton */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 px-2 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 px-2 py-3 border-t border-white/5">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 flex-1"
              style={{ opacity: 1 - rowIdx * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Pre-built document card skeleton */
export function SkeletonDocCard() {
  return (
    <div className="glass rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

/** Pre-built chart skeleton */
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton
        className="w-full"
        style={{ height: `${height}px` }}
        rounded="xl"
      />
    </div>
  )
}
