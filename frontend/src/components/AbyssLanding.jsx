import { useEffect, useRef, useState } from 'react'
import './AbyssLanding.css'

const MESSAGE = "And now you smile, for you've logged into the beautiful abyss"
const TYPE_INTERVAL_MS = 58
const REVEAL_PAUSE_MS = 950
const VIMEO_ORIGIN = 'https://player.vimeo.com'
const VIMEO_PLAYER_URL = 'https://player.vimeo.com/video/790050266?autoplay=1&controls=0&muted=0&title=0&byline=0&portrait=0&dnt=1&playsinline=1&autopause=0'

export default function AbyssLanding() {
  const [visibleCharacters, setVisibleCharacters] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [filmRevealed, setFilmRevealed] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef(null)

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

    let hasStarted = false
    const iframe = iframeRef.current
    const listenForPlayback = () => {
      iframe?.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), VIMEO_ORIGIN)
    }
    const onMessage = (event) => {
      if (event.origin !== VIMEO_ORIGIN) return
      let payload = event.data
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload) } catch { return }
      }
      if (payload?.event === 'play' || payload?.event === 'playing') {
        hasStarted = true
        setPlaying(true)
        setAudioBlocked(false)
      }
      if (payload?.event === 'error') {
        setAudioBlocked(true)
      }
    }

    window.addEventListener('message', onMessage)
    iframe?.addEventListener('load', listenForPlayback)
    listenForPlayback()
    const fallback = window.setTimeout(() => {
      if (!hasStarted) setAudioBlocked(true)
    }, 2400)

    return () => {
      window.removeEventListener('message', onMessage)
      iframe?.removeEventListener('load', listenForPlayback)
      window.clearTimeout(fallback)
    }
  }, [filmRevealed])

  const beginWithSound = () => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: 1 }), VIMEO_ORIGIN)
    iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), VIMEO_ORIGIN)
    setAudioBlocked(false)
    window.setTimeout(() => {
      if (!playing) setAudioBlocked(true)
    }, 1800)
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

      {filmRevealed && (
        <iframe
          ref={iframeRef}
          className="abyss-film is-revealed"
          src={VIMEO_PLAYER_URL}
          title="The beautiful abyss"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {filmRevealed && audioBlocked && !playing && (
        <button type="button" className="abyss-audio-gate" onClick={beginWithSound}>
          <span className="abyss-audio-gate-mark" aria-hidden="true">↗</span>
          <span>ENTER THE ABYSS</span>
          <small>Tap once to begin with sound</small>
        </button>
      )}

      <span className="abyss-index" aria-hidden="true">HV — 001 / THE ABYSS</span>
    </main>
  )
}
