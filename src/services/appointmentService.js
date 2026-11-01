import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'

const APPOINTMENTS = 'appointments'

function requireFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured yet. Add your project values to .env first.')
  }
}

export async function createAppointment(form) {
  requireFirebase()
  const appointmentRef = doc(collection(db, APPOINTMENTS))
  await setDoc(appointmentRef, {
    patientName: form.patientName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
    date: form.date,
    preferredTime: form.preferredTime,
    timezone: 'Asia/Kolkata',
    status: 'requested',
    reviewStatus: 'not_requested',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return appointmentRef
}

export async function getAppointments({ pageSize = 20, cursor = null } = {}) {
  requireFirebase()
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize)]
  if (cursor) constraints.splice(1, 0, startAfter(cursor))
  const snapshot = await getDocs(query(collection(db, APPOINTMENTS), ...constraints))

  return {
    items: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })),
    cursor: snapshot.docs.at(-1) || null,
  }
}

export async function updateAppointmentStatus(id, status) {
  requireFirebase()
  const batch = writeBatch(db)
  const appointmentRef = doc(db, APPOINTMENTS, id)
  const update = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'completed') {
    update.completedAt = serverTimestamp()
    update.reviewStatus = 'requested'
  }

  batch.update(appointmentRef, update)
  if (status === 'completed') {
    const reviewRequestRef = doc(db, 'reviewRequests', id)
    const reviewRequestSnap = await getDoc(reviewRequestRef)
    if (reviewRequestSnap.exists()) {
      batch.update(reviewRequestRef, { status: 'requested', updatedAt: serverTimestamp() })
    } else {
      const appointmentSnap = await getDoc(appointmentRef)
      const appointment = appointmentSnap.data()
      batch.set(reviewRequestRef, {
        appointmentId: id,
        patientName: appointment.patientName,
        status: 'requested',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }
  return batch.commit()
}
