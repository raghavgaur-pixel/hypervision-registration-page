import { useEffect, useRef, useState } from 'react'
import './AbyssLanding.css'

const MESSAGE = "And now you smile, for you've logged into the beautiful abyss"
const TYPE_INTERVAL_MS = 58
const REVEAL_PAUSE_MS = 950

export default function AbyssLanding() {
  const [visibleCharacters, setVisibleCharacters] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [filmRevealed, setFilmRevealed] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (visibleCharacters >= MESSAGE.length) {
      setTypingDone(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setVisibleCharacters((current) => Math.min(current + 1, MESSAGE.length))
    }, TYPE_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [visibleCharacters])

  useEffect(() => {
    if (!typingDone) return undefined
    const timer = window.setTimeout(() => setFilmRevealed(true), REVEAL_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [typingDone])

  useEffect(() => {
    if (!filmRevealed) return undefined
    const video = videoRef.current
    if (!video) return undefined

    video.muted = false
    video.volume = 1
    const playback = video.play()
    if (playback && typeof playback.then === 'function') {
      playback
        .then(() => setAudioBlocked(false))
        .catch(() => {
          // Browsers may block audible autoplay after an async login flow.
          setAudioBlocked(true)
        })
    }
    return undefined
  }, [filmRevealed])

  const beginWithSound = async () => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.volume = 1
    try {
      await video.play()
      setAudioBlocked(false)
    } catch {
      setAudioBlocked(true)
    }
  }

  return (
    <main className="abyss-landing" aria-label="Hypervision">
      <div className="abyss-atmosphere" aria-hidden="true" />
      <div className={`abyss-opening ${filmRevealed ? 'is-leaving' : ''}`}>
        <p className="abyss-opening-label">HYPERVISION / SESSION ESTABLISHED</p>
        <h1 className="abyss-typewriter" aria-label={MESSAGE}>
          <span aria-hidden="true">{MESSAGE.slice(0, visibleCharacters)}</span>
          {!typingDone && <span className="abyss-caret" aria-hidden="true" />}
        </h1>
      </div>

      <video
        ref={videoRef}
        className={`abyss-film ${filmRevealed ? 'is-revealed' : ''}`}
        src="/abyss.mp4"
        preload="auto"
        playsInline
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label="The beautiful abyss"
        onError={() => {
          setMediaError(true)
          setAudioBlocked(false)
        }}
      />

      {filmRevealed && audioBlocked && !mediaError && (
        <button type="button" className="abyss-audio-gate" onClick={beginWithSound}>
          <span className="abyss-audio-gate-mark" aria-hidden="true">↗</span>
          <span>ENTER THE ABYSS</span>
          <small>Tap once to begin with sound</small>
        </button>
      )}

      {filmRevealed && mediaError && (
        <div className="abyss-reel-missing" role="status">
          <span>THE FINAL REEL</span>
          <p>Awaiting its place in the archive.</p>
        </div>
      )}

      <span className="abyss-index" aria-hidden="true">HV — 001 / THE ABYSS</span>
    </main>
  )
}
