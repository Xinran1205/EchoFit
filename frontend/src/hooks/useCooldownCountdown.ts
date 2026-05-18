import { useCallback, useEffect, useState } from 'react'

export function useCooldownCountdown() {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [remainingSeconds])

  const startCountdown = useCallback((seconds: number) => {
    setRemainingSeconds(Math.max(0, Math.floor(seconds)))
  }, [])

  const resetCountdown = useCallback(() => {
    setRemainingSeconds(0)
  }, [])

  return {
    remainingSeconds,
    resetCountdown,
    startCountdown
  }
}
