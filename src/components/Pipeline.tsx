import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

interface PipelineProps {
  stages: string[]
  currentStage: string
  onStageClick?: (stage: string) => void
}

export function Pipeline({ stages, currentStage, onStageClick }: PipelineProps) {
  const currentIndex = stages.indexOf(currentStage)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.children[currentIndex] as HTMLElement
      if (activeEl) {
        const containerWidth = containerRef.current.offsetWidth
        const elementOffset = activeEl.offsetLeft
        const elementWidth = activeEl.offsetWidth

        containerRef.current.scrollTo({
          left: elementOffset - containerWidth / 2 + elementWidth / 2,
          behavior: 'smooth',
        })
      }
    }
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="flex w-full overflow-x-auto text-[11px] font-medium h-8 [&::-webkit-scrollbar]:hidden rounded-md border"
    >
      {stages.map((stage, idx) => {
        const isPast = idx < currentIndex
        const isCurrent = idx === currentIndex

        return (
          <div
            key={stage}
            onClick={() => onStageClick?.(stage)}
            className={cn(
              'relative flex-none flex items-center justify-center px-4 cursor-pointer transition-colors whitespace-nowrap group border-l',
              isCurrent
                ? 'bg-white text-solved font-bold border-gray-300 shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-50 border-gray-200',
              idx === 0 && 'border-l-0',
            )}
            style={{
              clipPath:
                idx < stages.length - 1
                  ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)'
                  : 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)',
              marginLeft: idx > 0 ? '-10px' : '0',
              paddingLeft: idx > 0 ? '1.5rem' : '1rem',
              paddingRight: idx < stages.length - 1 ? '1.5rem' : '1rem',
              zIndex: stages.length - idx,
            }}
          >
            <span className="truncate z-10">{stage}</span>
          </div>
        )
      })}
    </div>
  )
}
