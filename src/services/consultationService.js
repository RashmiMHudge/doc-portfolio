import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'

const APPOINTMENTS = 'appointments'

function requireFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured yet. Add your project values to .env first.')
  }
}

export async function getConsultation(consultationId) {
  requireFirebase()
  const docRef = doc(db, APPOINTMENTS, consultationId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('Consultation not found.')
  }
  return { id: docSnap.id, ...docSnap.data() }
}

export async function markConsultationCompleted(consultationId) {
  requireFirebase()
  return updateDoc(doc(db, APPOINTMENTS, consultationId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    reviewStatus: 'not_requested',
  })
}

export async function updateConsultationReviewStatus(consultationId, reviewStatus) {
  requireFirebase()
  return updateDoc(doc(db, APPOINTMENTS, consultationId), {
    reviewStatus,
    reviewStatusUpdatedAt: serverTimestamp(),
  })
}

export async function getConsultationByPatientEmail(email) {
  requireFirebase()
  const q = query(collection(db, APPOINTMENTS), where('email', '==', email.trim()))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}
