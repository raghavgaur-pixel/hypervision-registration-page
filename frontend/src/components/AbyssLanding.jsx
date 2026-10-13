import { useEffect, useRef, useState } from 'react'
import './AbyssLanding.css'

const MESSAGE = "And now you smile, for you've logged into the beautiful abyss"
const TYPE_INTERVAL_MS = 58
const REVEAL_PAUSE_MS = 950
const PLAYER_CHECK_MS = 2400
const VIMEO_ORIGIN = 'https://player.vimeo.com'

// Load and quietly warm the player while the typewriter is still running.
// We rewind to zero before the reveal so the visible reel starts from frame one.
const VIMEO_PLAYER_URL = 'https://player.vimeo.com/video/790050266?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&dnt=1&playsinline=1&autopause=0&api=1&player_id=hypervision-abyss'

export default function AbyssLanding({ onSignOut, signingOut = false }) {
  const [visibleCharacters, setVisibleCharacters] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [filmRevealed, setFilmRevealed] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioPromptDismissed, setAudioPromptDismissed] = useState(false)
  const iframeRef = useRef(null)
  const filmRevealedRef = useRef(false)
  const playingRef = useRef(false)
  const soundConfirmedRef = useRef(false)
  const audioPromptDismissedRef = useRef(false)

  const postToPlayer = (method, value) => {
    const player = iframeRef.current?.contentWindow
    if (!player) return
    const message = value === undefined ? { method } : { method, value }
    player.postMessage(JSON.stringify(message), VIMEO_ORIGIN)
  }

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

  // Vimeo is mounted from the first render, behind the opening copy, so its
  // player and initial video segments can load during the typewriter sequence.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return undefined

    const addPlayerListeners = () => {
      for (const eventName of ['play', 'playing', 'loaded', 'volumechange', 'error']) {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: 'addEventListener', value: eventName }),
          VIMEO_ORIGIN,
        )
      }
    }

    const onMessage = (event) => {
      if (event.origin !== VIMEO_ORIGIN) return

      let payload = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (payload?.event === 'play' || payload?.event === 'playing') {
        if (filmRevealedRef.current) {
          playingRef.current = true
          setPlaying(true)
        }
      }

      if (payload?.event === 'volumechange' && filmRevealedRef.current) {
        const rawVolume = payload?.data?.volume ?? payload?.data
        const volume = Number(rawVolume)
        if (Number.isFinite(volume) && volume > 0) {
          soundConfirmedRef.current = true
          setAudioBlocked(false)
        }
      }

      if (payload?.event === 'error' && filmRevealedRef.current) {
        setAudioBlocked(true)
      }
    }

    window.addEventListener('message', onMessage)
    iframe.addEventListener('load', addPlayerListeners)
    addPlayerListeners()

    return () => {
      window.removeEventListener('message', onMessage)
      iframe.removeEventListener('load', addPlayerListeners)
    }
  }, [])

  useEffect(() => {
    if (!typingDone) return undefined

    // Pause and rewind while the completed line is still onscreen. The opening
    // pause gives the already-loaded player a moment to settle at the first frame.
    postToPlayer('pause')
    postToPlayer('setCurrentTime', 0)

    const timer = window.setTimeout(() => setFilmRevealed(true), REVEAL_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [typingDone])

  useEffect(() => {
    if (!filmRevealed) return undefined

    filmRevealedRef.current = true
    playingRef.current = false
    soundConfirmedRef.current = false
    postToPlayer('setCurrentTime', 0)
    postToPlayer('setVolume', 1)
    postToPlayer('play')

    const fallback = window.setTimeout(() => {
      if (!playingRef.current || !soundConfirmedRef.current) {
        setAudioBlocked(true)
      }
    }, PLAYER_CHECK_MS)

    return () => window.clearTimeout(fallback)
  }, [filmRevealed])

  const beginWithSound = () => {
    audioPromptDismissedRef.current = true
    setAudioPromptDismissed(true)
    postToPlayer('setVolume', 1)
    postToPlayer('play')
    setAudioBlocked(false)

    window.setTimeout(() => {
      if (!playingRef.current || !soundConfirmedRef.current) {
        setAudioBlocked(true)
      }
    }, PLAYER_CHECK_MS)
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

      <iframe
        ref={iframeRef}
        className={`abyss-film ${filmRevealed ? 'is-revealed' : 'is-preloading'}`}
        src={VIMEO_PLAYER_URL}
        title="The beautiful abyss"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {filmRevealed && audioBlocked && !audioPromptDismissed && (
        <button type="button" className="abyss-audio-gate" onClick={beginWithSound}>
          <span className="abyss-audio-gate-mark" aria-hidden="true">↗</span>
          <span>ENTER THE ABYSS</span>
          <small>Tap once to begin with sound</small>
        </button>
      )}

      <button
        type="button"
        className="abyss-logout"
        onClick={onSignOut}
        disabled={signingOut}
        aria-label={signingOut ? 'Signing out' : 'Log out of Hypervision'}
      >
        <span>{signingOut ? 'SIGNING OUT…' : 'LOG OUT'}</span>
        <span aria-hidden="true">↗</span>
      </button>

      <span className="abyss-index" aria-hidden="true">HV — 001 / THE ABYSS</span>
    </main>
  )
}
