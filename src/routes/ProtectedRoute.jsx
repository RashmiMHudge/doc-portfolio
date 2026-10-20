import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config.js'

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: isFirebaseConfigured, user: null })

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined
    }

    return onAuthStateChanged(auth, (user) => {
      setState({ loading: false, user })
    })
  }, [])

  if (state.loading) {
    return <main className="center-page">Checking admin access...</main>
  }

  if (!state.user) {
    return <Navigate to="/login" replace />
  }

  return children
}
