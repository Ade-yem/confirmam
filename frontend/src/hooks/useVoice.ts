import { useState, useCallback, useEffect } from 'react'

export function useVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Periodically check if speechSynthesis is speaking as a fallback, 
  // since browser speech events are sometimes unreliable.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('SpeechSynthesis is not supported in this browser.')
      return
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-NG' // Nigerian English
    utterance.rate = 0.95   // Slightly slower for noisy environments
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak, isSpeaking }
}
