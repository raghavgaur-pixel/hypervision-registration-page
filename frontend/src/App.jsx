import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Orbit,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
  LogOut,
} from 'lucide-react'
import PortalScene from './components/PortalScene.jsx'
import AshenShelf from './components/AshenShelf.jsx'
import AbyssLanding from './components/AbyssLanding.jsx'
import { supabase, supabaseReady } from './lib/supabase'

const DEFAULT_PUBLIC_SITE_URL = 'https://hypervision-registration-page.vercel.app'
const PUBLIC_SITE_URL = (() => {
  const configuredUrl = import.meta.env.VITE_SITE_URL
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl)
      // Never let local development leak localhost into a production email link.
      if (url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        return url.origin
      }
    } catch {
      // Fall back to the canonical deployed URL for invalid configuration.
    }
  }
  return DEFAULT_PUBLIC_SITE_URL
})()

function PasswordField({ value, onChange, visible, setVisible, autoComplete = 'current-password', placeholder = 'At least 8 characters' }) {
  return (
    <div className="input-wrap password-wrap">
      <LockKeyhole size={17} aria-hidden="true" />
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={8}
        required
      />
      <button className="visibility-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

function Brand({ compact = false }) {
  return (
    <a className="wordmark" href={window.location.pathname || '/'} aria-label="Hypervision home">
      <span className="brand-symbol"><img className="brand-symbol-img" src="/hypervision-mark.svg" alt="" /></span>
      <span>HYPERVISION<span className="brand-period">.</span></span>
      {!compact && <span className="brand-edition">A NEW PERSPECTIVE</span>}
    </a>
  )
}

function Notice({ notice }) {
  if (!notice) return null
  return (
    <div className={'notice ' + notice.type} role="status" aria-live="polite">
      <span className="notice-mark">{notice.type === 'success' ? <Check size={15} /> : <Zap size={15} />}</span>
      <span>{notice.text}</span>
    </div>
  )
}

function VerifiedPage({ onContinue }) {
  const confetti = Array.from({ length: 24 }, (_, index) => index)
  return (
    <main className="verified-shell">
      <div className="verified-grid" aria-hidden="true" />
      <div className="verified-glow verified-glow-one" />
      <div className="verified-glow verified-glow-two" />
      <div className="confetti-field" aria-hidden="true">
        {confetti.map((index) => <i key={index} style={{ '--i': index, left: (((index * 37) % 100) + '%'), top: (((index * 23) % 88) + '%'), '--delay': ((index % 9) * -0.23) + 's', '--rotation': (index * 17) + 'deg' }} />)}
      </div>
      <header className="topbar verified-topbar">
        <Brand />
        <div className="topbar-right"><span className="system-status"><span /> CONFIRMATION RECEIVED</span><span className="topbar-index">200 / OK</span></div>
      </header>
      <section className="verified-content">
        <div className="verified-kicker"><span className="kicker-dot" /> IDENTITY PROTOCOL / COMPLETE</div>
        <div className="verified-visual">
          <PortalScene variant="celebration" />
          <div className="verified-orbit-label"><span>INBOX ACCESS</span><strong>PROVEN.</strong></div>
          <div className="human-stamp"><span>OFFICIAL</span><strong>REAL<br />HUMAN</strong><small>EST. JUST NOW</small></div>
        </div>
        <div className="verified-copy">
          <p className="eyebrow">THE COUNCIL HAS REVIEWED YOUR EMAIL</p>
          <h1>You're real.<br /><span>Allegedly.</span></h1>
          <p className="verified-description">You clicked one link and unlocked a whole new dimension. The bar was on the floor. You cleared it with style.</p>
          <div className="meme-card">
            <div className="meme-topline"><span>BREAKING NEWS</span><span>HV / 001</span></div>
            <div className="meme-body">
              <div className="meme-emoji" aria-hidden="true">🗿</div>
              <div className="meme-quote"><span>POV</span><strong>YOU CHECKED<br />YOUR EMAIL.</strong><small>THE INTERNET IS NO LONGER SAFE.</small></div>
            </div>
            <div className="meme-footer"><span>VERIFIED EMAIL HOLDER</span><span className="meme-seal"><Check size={12} /> CERTIFIED</span></div>
          </div>
          <button className="submit-button verified-continue" type="button" onClick={onContinue}>
            <span>Okay, let me in</span><ArrowRight size={18} />
          </button>
          <p className="tiny-disclaimer">No thoughts were verified during this process. Only your email.</p>
        </div>
      </section>
      <footer className="page-footer"><span>HYPERVISION / YOU MADE IT</span><span>WELCOME TO THE LORE <ArrowDownRight size={13} /></span></footer>
    </main>
  )
}

function App() {
  const [mode, setMode] = useState('signup')
  const [showShelf, setShowShelf] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    return !params.has('verified') && !params.has('code') && !params.has('token_hash') && !params.has('type') && !params.has('error') && !params.has('error_code') && !params.has('error_description') && !hash.includes('type=recovery')
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [recoveryFlow, setRecoveryFlow] = useState(false)
  const [showVerifiedPage, setShowVerifiedPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('verified') === '1' && !params.has('error') && !params.has('error_code') && !params.has('error_description')
  })

  useEffect(() => {
    if (!supabaseReady) {
      setBooting(false)
      return undefined
    }

    let active = true
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryFlow(true)
        setMode('update-password')
      }
      setUser(session?.user ?? null)
    })

    supabase.auth.getSession()
      .then(({ data: sessionData }) => {
        if (active) setUser(sessionData.session?.user ?? null)
      })
      .catch(() => {
        if (active) setNotice({ type: 'error', text: 'Could not restore your session. Please refresh and try again.' })
      })
      .finally(() => { if (active) setBooting(false) })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === '1' && (params.has('error') || params.has('error_code') || params.has('error_description'))) {
      setNotice({ type: 'error', text: 'That verification link may have expired. Request a fresh email and try again.' })
    }
  }, [])

  useEffect(() => {
    if (!user || !supabaseReady) {
      setProfileName('')
      return undefined
    }
    let active = true
    setProfileLoading(true)
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setNotice({ type: 'error', text: 'Your session is active, but the profile could not be loaded.' })
          setProfileName(user.user_metadata?.display_name || '')
        } else {
          setProfileName(data?.display_name || user.user_metadata?.display_name || '')
        }
      })
      .finally(() => { if (active) setProfileLoading(false) })
    return () => { active = false }
  }, [user])

  const strength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  const friendlyError = (message) => {
    const value = message?.toLowerCase() ?? ''
    if (value.includes('invalid login credentials')) return 'That email and password do not match. Try again.'
    if (value.includes('already registered') || value.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.'
    if (value.includes('password should be at least') || value.includes('password is too short')) return 'Your password needs at least 8 characters.'
    if (value.includes('email not confirmed')) return 'Your email still needs verifying. Check your inbox for the confirmation link.'
    if (value.includes('rate limit') || value.includes('too many requests')) return 'A few too many attempts. Take a breath and try again shortly.'
    if (value.includes('fetch') || value.includes('network')) return 'Could not reach the authentication service. Check your connection and try again.'
    if (value.includes('email address') && value.includes('invalid')) return 'That email address does not look valid. Check it and try again.'
    return 'Something unexpected happened. Please try again.'
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setNotice(null)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice(null)

    if (!supabaseReady) {
      setNotice({ type: 'error', text: 'Supabase is not connected yet. Configure the frontend environment variables.' })
      return
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setNotice({ type: 'error', text: 'Please enter a name with at least 2 characters.' })
        return
      }
      if (password !== confirmPassword) {
        setNotice({ type: 'error', text: 'Those passwords do not match yet.' })
        return
      }
      if (password.length < 8) {
        setNotice({ type: 'error', text: 'Choose a password with at least 8 characters.' })
        return
      }
      if (!accepted) {
        setNotice({ type: 'error', text: 'Accept the terms before creating your account.' })
        return
      }
    }

    if (mode === 'update-password' && password !== confirmPassword) {
      setNotice({ type: 'error', text: 'Those passwords do not match yet.' })
      return
    }

    setBusy(true)
    let loginFullscreenAttempt = null
    try {
      // Use the trusted Login click to request fullscreen before awaiting auth.
      // Keep it active through the typewriter and video when sign-in succeeds.
      if (
        mode === 'login' &&
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      ) {
        loginFullscreenAttempt = document.documentElement.requestFullscreen().catch(() => null)
      }

      if (mode === 'signup') {
        // Confirmation links must target the public app, never whichever host
        // happens to be open (for example localhost during local development).
        const redirectUrl = new URL('/?verified=1', PUBLIC_SITE_URL)
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: redirectUrl.toString(),
          },
        })
        if (error) throw error

        // Supabase intentionally obfuscates duplicate sign-ups when email confirmation is enabled.
        // A confirmed account can come back with an empty identities array and no error.
        if (data.user?.identities?.length === 0) {
          setNotice({ type: 'error', text: 'An account with this email already exists. Switch to Sign in to continue.' })
          setPassword('')
          setConfirmPassword('')
          return
        }

        if (data.session) {
          setNotice({ type: 'success', text: 'Your account is ready. Welcome to Hypervision.' })
        } else {
          setNotice({ type: 'success', text: 'Check your inbox. One link stands between you and your new dimension.' })
          setPassword('')
          setConfirmPassword('')
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        setNotice({ type: 'success', text: 'Session restored. The universe has resumed.' })
      } else if (mode === 'update-password') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setRecoveryFlow(false)
        await supabase.auth.signOut()
        setUser(null)
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setNotice({ type: 'success', text: 'Password updated. Sign in with your new key.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: new URL('/', PUBLIC_SITE_URL).toString(),
        })
        if (error) throw error
        setNotice({ type: 'success', text: 'If an account exists for that email, a reset link is on its way.' })
      }
    } catch (error) {
      // If authentication failed, leave fullscreen so the login page is normal.
      if (mode === 'login' && loginFullscreenAttempt) {
        await loginFullscreenAttempt
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
      }
      setNotice({ type: 'error', text: friendlyError(error.message) })
    } finally {
      setBusy(false)
    }
  }

  const leaveVerifiedPage = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('verified')
    url.searchParams.delete('code')
    url.searchParams.delete('error')
    url.searchParams.delete('error_description')
    url.hash = ''
    window.history.replaceState({}, document.title, url.pathname + url.search)
    setShowVerifiedPage(false)
    setMode('login')
    setNotice({ type: 'success', text: 'Email confirmation complete. Welcome to Hypervision.' })
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!user || !supabaseReady) return
    setProfileSaving(true)
    setNotice(null)
    const cleanName = profileName.trim()
    if (cleanName.length < 2 || cleanName.length > 80) {
      setNotice({ type: 'error', text: 'Your display name must be between 2 and 80 characters.' })
      setProfileSaving(false)
      return
    }
    try {
      const { error } = await supabase.from('profiles').update({ display_name: cleanName }).eq('id', user.id)
      if (error) throw error
      const { error: metadataError } = await supabase.auth.updateUser({ data: { display_name: cleanName } })
      if (metadataError) throw metadataError
      setNotice({ type: 'success', text: 'Profile updated. Looking good.' })
    } catch {
      setNotice({ type: 'error', text: 'Could not save your profile. Please try again.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    setBusy(true)
    const { error } = await supabase.auth.signOut()
    setBusy(false)
    if (error) setNotice({ type: 'error', text: friendlyError(error.message) })
    else {
      setNotice({ type: 'success', text: 'Signed out safely. The portal will be here when you return.' })
      setMode('login')
    }
  }

  if (booting) {
    return (
      <main className="loading-screen">
        <div className="loading-orbit"><Orbit size={28} /></div>
        <span>ALIGNING THE STARS</span>
        <div className="loading-track"><i /></div>
      </main>
    )
  }

  if (showVerifiedPage && !recoveryFlow) return <VerifiedPage onContinue={leaveVerifiedPage} />

  if (user && !recoveryFlow) {
    return <AbyssLanding onSignOut={signOut} signingOut={busy} />
  }

  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'
  const isUpdatePassword = mode === 'update-password'

  const renderAuthPanel = ({ onModeChange } = {}) => {
    const switchMode = (nextMode) => {
      if (onModeChange) onModeChange(nextMode)
      else changeMode(nextMode)
    }
    return (
      <div className="ashen-auth-panel">
        <div className="ashen-auth-heading">
          <span className="ashen-auth-eyebrow">{isReset ? 'RECOVERY PROTOCOL' : isUpdatePassword ? 'SECURITY KEY / RENEWAL' : isSignup ? 'VOLUME I / NEW IDENTITY' : 'VOLUME II / RETURNING IDENTITY'}</span>
          <h2>{isReset ? <>Find your<br /><em>way back.</em></> : isUpdatePassword ? <>A second<br /><em>beginning.</em></> : isSignup ? <>Write your<br /><em>first page.</em></> : <>Welcome<br /><em>back.</em></>}</h2>
          <p>{isReset ? 'A secure link will be sent if an account matches that address.' : isUpdatePassword ? 'Choose a new password for your Hypervision identity.' : isSignup ? 'Create an identity. The rest of the archive will open in time.' : 'Your place is still here. Pick up where you left off.'}</p>
        </div>

        {!isReset && !isUpdatePassword && (
          <div className="ashen-auth-mode" role="tablist" aria-label="Authentication mode">
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'active' : ''} onClick={() => switchMode('signup')}>Register</button>
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
          </div>
        )}

        <form className="ashen-auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="ashen-auth-field">
              <span>YOUR NAME</span>
              <div className="ashen-auth-input"><UserRound size={15} aria-hidden="true" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" autoComplete="name" minLength={2} maxLength={80} required /></div>
            </label>
          )}

          <label className="ashen-auth-field">
            <span>EMAIL ADDRESS</span>
            <div className="ashen-auth-input"><Mail size={15} aria-hidden="true" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@somewhere.com" autoComplete="email" maxLength={254} required /></div>
          </label>

          {!isReset && (
            <label className="ashen-auth-field">
              <span className="ashen-auth-label-line"><span>{isUpdatePassword ? 'NEW PASSWORD' : 'PASSWORD'}</span>{!isSignup && !isUpdatePassword && <button type="button" className="ashen-auth-text-button" onClick={() => changeMode('reset')}>Forgot password?</button>}{(isSignup || isUpdatePassword) && <small>MIN. 8 CHARACTERS</small>}</span>
              <div className="ashen-auth-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isSignup || isUpdatePassword ? 'new-password' : 'current-password'} minLength={8} required />
                <button className="ashen-auth-visibility" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {isSignup && password.length > 0 && <div className="ashen-auth-strength" aria-label={'Password strength ' + strength + ' out of 4'}><div>{[1, 2, 3, 4].map((item) => <i key={item} className={strength >= item ? 'filled' : ''} />)}</div><span>{['', 'Getting there', 'Fair', 'Strong', 'Excellent'][strength]}</span></div>}
            </label>
          )}

          {(isSignup || isUpdatePassword) && (
            <label className="ashen-auth-field">
              <span>{isUpdatePassword ? 'CONFIRM NEW PASSWORD' : 'CONFIRM PASSWORD'}</span>
              <div className="ashen-auth-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Type it one more time" autoComplete="new-password" minLength={8} required />
                <button className="ashen-auth-visibility" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </label>
          )}

          {isSignup && (
            <label className="ashen-auth-terms">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              <span>I agree to the <a href="https://supabase.com/terms" target="_blank" rel="noreferrer">terms of service</a> and understand the privacy policy.</span>
            </label>
          )}

          <Notice notice={notice} />
          <button className="ashen-auth-submit" type="submit" disabled={busy}>
            <span>{busy ? (isReset ? 'Sending secure link…' : isSignup ? 'Creating your orbit…' : isUpdatePassword ? 'Updating password…' : 'Opening the archive…') : isReset ? 'Send reset link' : isUpdatePassword ? 'Save new password' : isSignup ? 'Create my account' : 'Enter Hypervision'}</span>
            {busy ? <span className="ashen-auth-spinner" /> : <ArrowRight size={16} />}
          </button>
        </form>

        {(isReset || isUpdatePassword) ? (
          <button className="ashen-auth-back" type="button" onClick={() => { setRecoveryFlow(false); switchMode('login') }}><ArrowLeft size={14} /> Back to Login</button>
        ) : (
          <p className="ashen-auth-switch-copy">{isSignup ? 'Already have an identity?' : 'New to the archive?'} <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Return to Login' : 'Create one'}</button></p>
        )}
        <div className="ashen-auth-foot"><ShieldCheck size={13} /><span>ENCRYPTED IDENTITY / POWERED BY SUPABASE</span></div>
      </div>
    )
  }

  return (
    <AshenShelf
      initialAuthMode={recoveryFlow ? mode : (!showShelf && !showVerifiedPage ? mode : null)}
      activeAuthMode={mode}
      onChoose={(nextMode) => changeMode(nextMode)}
      renderAuthPanel={renderAuthPanel}
    />
  )
}

export default App
