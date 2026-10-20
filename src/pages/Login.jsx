import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Lock, LogIn } from 'lucide-react'
import { auth, isFirebaseConfigured } from '../firebase/config.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured yet. Add the client Firebase project values to .env.')
      return
    }

    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <Link className="brand" to="/">
        <span className="brand-mark">AR</span>
        <span>
          <strong>Doctor Website</strong>
          <small>Admin access</small>
        </span>
      </Link>
      <form className="login-card" onSubmit={handleSubmit}>
        <Lock size={28} />
        <h1>Admin Login</h1>
        <p>Use the Firebase Authentication email/password account created for the doctor or clinic team.</p>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button full" type="submit" disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
