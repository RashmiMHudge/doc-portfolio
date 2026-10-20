import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
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
  const slotRef = doc(db, 'consultationSlots', `${form.date}_${form.slotId.replace(':', '-')}`)
  const appointmentRef = doc(collection(db, APPOINTMENTS))
  await runTransaction(db, async (transaction) => {
    const slotSnap = await transaction.get(slotRef)
    if (slotSnap.exists()) throw new Error('That consultation slot is no longer available. Please choose another time.')

    const [hours, minutes] = form.slotId.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + 30
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    transaction.set(appointmentRef, {
      patientName: form.patientName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      date: form.date,
      slotId: form.slotId,
      startTime: form.slotId,
      endTime,
      durationMinutes: 30,
      status: 'requested',
      consultationClient: 'WhatsApp',
      reviewStatus: 'not_requested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    transaction.set(slotRef, { appointmentId: appointmentRef.id, date: form.date, slotId: form.slotId, createdAt: serverTimestamp() })
    transaction.set(doc(db, 'reviewRequests', appointmentRef.id), { appointmentId: appointmentRef.id, patientName: form.patientName.trim(), status: 'active', createdAt: serverTimestamp() })
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

