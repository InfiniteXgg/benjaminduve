import { useEffect, useState } from 'react'

export default function NoticeBanner({ message, tone = 'info', fadeMs = 260 }) {
  const [displayMessage, setDisplayMessage] = useState(message)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (message) {
      setDisplayMessage(message)
      setIsFading(false)
      return
    }

    if (!displayMessage) return

    setIsFading(true)
    const timerId = setTimeout(() => {
      setDisplayMessage('')
      setIsFading(false)
    }, fadeMs)

    return () => clearTimeout(timerId)
  }, [message, displayMessage, fadeMs])

  if (!displayMessage) return null

  return <div className={`notice notice-${tone} ${isFading ? 'is-fading' : ''}`}>{displayMessage}</div>
}
