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
import { supabase, supabaseReady } from './lib/supabase'

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
      <span className="brand-symbol"><Orbit size={21} strokeWidth={1.65} /></span>
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
    try {
      if (mode === 'signup') {
        const redirectUrl = new URL(window.location.href)
        redirectUrl.search = ''
        redirectUrl.hash = ''
        redirectUrl.searchParams.set('verified', '1')
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
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setNotice({ type: 'success', text: 'If an account exists for that email, a reset link is on its way.' })
      }
    } catch (error) {
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
    const displayName = profileName || user.user_metadata?.display_name || 'Explorer'
    const initial = displayName.trim().charAt(0).toUpperCase() || 'H'
    return (
      <main className="portal-shell">
        <div className="portal-grid" aria-hidden="true" />
        <div className="portal-glow" />
        <header className="portal-topbar">
          <Brand />
          <div className="topbar-right"><span className="system-status"><span /> SESSION ACTIVE</span><span className="topbar-index">HV—01</span></div>
        </header>
        <section className="dashboard">
          <div className="dashboard-intro">
            <span className="eyebrow"><span className="eyebrow-line" /> IDENTITY CONFIRMED / 001</span>
            <h1>Well, hello<br /><span>{displayName}.</span></h1>
            <p>Your orbit is stable. Your corner of Hypervision is ready when you are.</p>
            <div className="dashboard-chips"><span><i /> AUTHENTICATED</span><span><ShieldCheck size={14} /> PROFILE PROTECTED</span></div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-head"><span>YOUR IDENTITY</span><span className="live-tag"><i /> LIVE</span></div>
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initial}</div>
              <div className="avatar-orbit avatar-orbit-one" /><div className="avatar-orbit avatar-orbit-two" />
              <div className="avatar-spark spark-one" /><div className="avatar-spark spark-two" />
            </div>
            <div className="profile-summary"><h2>{displayName}</h2><span>{user.email}</span></div>
            <div className="profile-divider" />
            <form className="profile-form" onSubmit={saveProfile}>
              <label className="field-group">
                <span className="field-label">DISPLAY NAME <span className="field-hint">2–80 CHARACTERS</span></span>
                <div className="input-wrap"><UserRound size={17} /><input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" minLength={2} maxLength={80} required disabled={profileLoading || profileSaving} /></div>
              </label>
              <button className="submit-button" type="submit" disabled={profileLoading || profileSaving}>
                <span>{profileLoading ? 'Loading profile…' : profileSaving ? 'Saving changes…' : 'Save changes'}</span>{profileSaving ? <span className="button-spinner" /> : <Check size={17} />}
              </button>
            </form>
            <Notice notice={notice} />
            <button className="signout-button" type="button" onClick={signOut} disabled={busy}>{busy ? 'Closing session…' : 'Sign out of Hypervision'} <LogOut size={16} /></button>
            <div className="card-foot"><ShieldCheck size={14} /><span>POWERED BY SUPABASE AUTH</span><span className="foot-divider" /><span>YOUR DATA, YOURS</span></div>
          </div>
          <div className="dashboard-orbit-scene"><PortalScene /></div>
        </section>
        <footer className="page-footer"><span>HYPERVISION / IDENTITY SYSTEMS</span><span>THE NEXT CHAPTER IS YOURS <ArrowDownRight size={13} /></span></footer>
      </main>
    )
  }

  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'
  const isUpdatePassword = mode === 'update-password'

  return (
    <main className="auth-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow ambient-one" />
      <div className="ambient-glow ambient-two" />
      <header className="topbar">
        <Brand />
        <div className="topbar-right"><span className="system-status"><span /> ALL SYSTEMS NOMINAL</span><span className="topbar-index">HV—01</span></div>
      </header>

      <div className="layout-grid">
        <section className="hero-panel">
          <PortalScene />
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A PORTAL TO WHAT'S NEXT</div>
            <h1>Be more than<br />your <span className="gradient-word">current tab.</span></h1>
            <p className="hero-description">A new perspective. A different frequency. Consider this your invitation to step a little further beyond the ordinary.</p>
            <div className="hero-cta">
              <span className="cta-orbit"><ArrowDownRight size={18} /></span>
              <div><strong>Your next chapter starts here.</strong><span>One identity. Infinite possibilities.</span></div>
            </div>
          </div>
          <div className="hero-side-note"><span className="side-note-line" /><span>FIELD NOTES / 001</span><strong>Make yourself at home<br />in the unknown.</strong></div>
          <div className="hero-bottom">
            <div className="coordinate-block"><span>KNOWN UNIVERSE</span><strong>LOCAL TIME: NOW</strong><strong>STATUS: BECOMING</strong></div>
            <div className="signal-block"><span>LIVE SIGNAL</span><div className="signal-bars">{Array.from({ length: 19 }, (_, index) => <i key={index} style={{ '--bar': (9 + ((index * 17) % 28)) + 'px' }} />)}</div></div>
          </div>
          <div className="hero-index">HV / EXPERIENCE DESIGN <span>•</span> VOL. 01</div>
        </section>

        <section className="form-side">
          <div className="form-card">
            <div className="form-card-top">
              <div className="form-icon"><Sparkles size={19} /></div>
              <span className="form-step">{isReset ? 'RECOVERY PROTOCOL' : isUpdatePassword ? 'NEW SECURITY KEY' : isSignup ? 'NEW IDENTITY / 01' : 'RETURNING IDENTITY / 02'}</span>
            </div>
            <div className="form-heading">
              <h2>{isReset ? 'Find your way back.' : isUpdatePassword ? 'A fresh start.' : isSignup ? 'Make an entrance.' : 'Missed you.'}</h2>
              <p>{isReset ? "We'll send a secure link to reset your password." : isUpdatePassword ? 'Set a new password for your Hypervision identity.' : isSignup ? "The universe is big. Your next chapter should be, too." : "Your place in the universe is still here."}</p>
            </div>

            {!isReset && !isUpdatePassword && (
              <div className="mode-switch" role="tablist" aria-label="Authentication mode">
                <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'active' : ''} onClick={() => changeMode('signup')}>Create account</button>
                <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="field-group">
                  <span className="field-label">YOUR NAME <span className="field-hint">THE HUMAN VERSION</span></span>
                  <div className="input-wrap"><UserRound size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" autoComplete="name" minLength={2} maxLength={80} required /></div>
                </label>
              )}

              <label className="field-group">
                <span className="field-label">EMAIL ADDRESS</span>
                <div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@somewhere.com" autoComplete="email" maxLength={254} required /></div>
              </label>

              {!isReset && (
                <label className="field-group">
                  <span className="field-label">{isUpdatePassword ? 'NEW PASSWORD' : 'PASSWORD'} <span className="field-hint">{isSignup || isUpdatePassword ? 'MIN. 8 CHARACTERS' : <button type="button" className="text-button" onClick={() => changeMode('reset')}>Forgot password?</button>}</span></span>
                  <PasswordField value={password} onChange={setPassword} visible={showPassword} setVisible={setShowPassword} autoComplete={isSignup || isUpdatePassword ? 'new-password' : 'current-password'} />
                  {isSignup && password.length > 0 && (
                    <div className="strength-meter" aria-label={'Password strength ' + strength + ' out of 4'}>
                      <div className="strength-track">{[1, 2, 3, 4].map((item) => <i key={item} className={strength >= item ? 'filled strength-' + strength : ''} />)}</div>
                      <span>{['', 'Getting there', 'Fair', 'Strong', 'Excellent'][strength]}</span>
                    </div>
                  )}
                </label>
              )}

              {(isSignup || isUpdatePassword) && (
                <label className="field-group">
                  <span className="field-label">CONFIRM PASSWORD</span>
                  <PasswordField value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} setVisible={setShowConfirmPassword} autoComplete="new-password" placeholder="Type it one more time" />
                </label>
              )}

              {isSignup && (
                <label className="terms-check">
                  <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                  <span className="custom-check"><Check size={12} /></span>
                  <span>I agree to the <a href="https://supabase.com/terms" target="_blank" rel="noreferrer">terms of service</a> and understand the privacy policy.</span>
                </label>
              )}

              <Notice notice={notice} />
              <button className="submit-button" type="submit" disabled={busy}>
                <span>{busy ? (isReset ? 'Sending secure link…' : isSignup ? 'Creating your orbit…' : isUpdatePassword ? 'Updating password…' : 'Opening the portal…') : isReset ? 'Send reset link' : isUpdatePassword ? 'Save new password' : isSignup ? 'Create my account' : 'Enter Hypervision'}</span>
                {busy ? <span className="button-spinner" /> : <ArrowRight size={18} />}
              </button>
            </form>

            {isReset || isUpdatePassword ? (
              <button className="back-link" type="button" onClick={() => { setRecoveryFlow(false); changeMode('login') }}><ArrowLeft size={15} /> Back to sign in</button>
            ) : (
              <div className="switch-prompt">
                <span>{isSignup ? 'Already have a place here?' : 'New to this universe?'}</span>
                <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in instead' : 'Create an account'} <ChevronRight size={14} /></button>
              </div>
            )}
            <div className="card-foot"><ShieldCheck size={14} /><span>SECURED BY SUPABASE</span><span className="foot-divider" /><span>YOUR DATA, YOURS</span></div>
          </div>
          <div className="form-side-note"><Zap size={13} /><span>Designed for the next version of you.</span></div>
          {!supabaseReady && <div className="setup-pill"><span /> SUPABASE AWAITS CONFIGURATION</div>}
        </section>
      </div>
      <footer className="page-footer"><span>HYPERVISION / IDENTITY SYSTEMS</span><span>BUILT FOR WHAT'S NEXT <ArrowDownRight size={13} /></span></footer>
    </main>
  )
}

export default App
