import { cn } from '../../utils/cn'

interface VoiceIndicatorProps {
  isSpeaking: boolean
  text?: string
  className?: string
}

export function VoiceIndicator({ isSpeaking, text, className }: VoiceIndicatorProps) {
  if (!isSpeaking) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center gap-3 bg-midnight text-white px-4 py-2.5 rounded-full shadow-lg border border-white/5 max-w-sm w-fit mx-auto transition-all",
        className
      )}
    >
      {/* 4 Animated Audio Wave Bars in Electric Lime (#7CFF6B) */}
      <div className="flex items-center gap-0.5 h-4 w-7 justify-center">
        <div className="w-1 h-full bg-lime rounded-full animate-voice-bar-1" />
        <div className="w-1 h-full bg-lime rounded-full animate-voice-bar-2" />
        <div className="w-1 h-full bg-lime rounded-full animate-voice-bar-3" />
        <div className="w-1 h-full bg-lime rounded-full animate-voice-bar-4" />
      </div>

      {text && (
        <span className="text-xs font-semibold tracking-wide text-gray-200 truncate max-w-[200px]">
          {text}
        </span>
      )}
    </div>
  )
}
