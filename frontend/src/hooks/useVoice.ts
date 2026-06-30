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

  // Offline-resilient dual-frequency soft chime synthesizer using Web Audio API
  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()

      // Tone 1: Mid-high pitch (A5 = 880 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, ctx.currentTime)
      
      gain1.gain.setValueAtTime(0, ctx.currentTime)
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.04) // soft attack
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2) // fast decay
      
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.2)

      // Tone 2: High pitch (E6 = 1318.51 Hz) slightly delayed
      const delay = 0.08
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + delay)
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + delay)
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.04)
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.3)
      
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + delay)
      osc2.stop(ctx.currentTime + delay + 0.3)
    } catch (err) {
      console.warn('Failed to play synthesized Web Audio chime:', err)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('SpeechSynthesis is not supported in this browser.')
      return
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()

    // 1. Synthesize the soft chime immediately
    playChime()

    // 2. Schedule the voice announcement to start after the chime (400ms delay)
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

    // Small timeout to allow the chime to ring first
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 400)
  }, [playChime])

  return { speak, isSpeaking }
}

