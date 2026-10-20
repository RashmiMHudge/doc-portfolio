import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'

const REVIEWS = 'reviews'
const APPOINTMENTS = 'appointments'
const REVIEW_REQUESTS = 'reviewRequests'

function requireFirebase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured yet. Add your project values to .env first.')
  }
}

export async function getReviewRequest(consultationId) {
  requireFirebase()
  const requestSnap = await getDoc(doc(db, REVIEW_REQUESTS, consultationId))
  if (!requestSnap.exists()) throw new Error('Review request not found.')
  return { id: requestSnap.id, ...requestSnap.data() }
}

export async function submitConsultationReview(consultationId, review) {
  requireFirebase()

  const requestRef = doc(db, REVIEW_REQUESTS, consultationId)
  const requestSnap = await getDoc(requestRef)
  if (!requestSnap.exists()) throw new Error('Review request not found.')
  const reviewRequest = requestSnap.data()
  const consultationRef = doc(db, APPOINTMENTS, consultationId)
  if (reviewRequest.status !== 'requested') {
    throw new Error('Only completed consultations can be reviewed.')
  }

  const reviewRef = doc(db, REVIEWS, consultationId)
  const batch = writeBatch(db)
  batch.set(reviewRef, {
    consultationId,
    patientName: review.patientName?.trim() || reviewRequest.patientName?.trim() || 'Anonymous',
    rating: Number(review.rating || 5),
    feedback: review.feedback?.trim() || '',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(consultationRef, { reviewStatus: 'submitted', reviewStatusUpdatedAt: serverTimestamp() })
  await batch.commit()
  return { id: consultationId, consultationId, ...review }
}

export async function getReviewForConsultation(consultationId) {
  requireFirebase()

  const q = query(collection(db, REVIEWS), where('consultationId', '==', consultationId))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
}

export async function getApprovedReviews({ pageSize = 3 } = {}) {
  requireFirebase()

  const snapshot = await getDocs(
    query(
      collection(db, REVIEWS),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ),
  )

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
}

export async function getReviews({ pageSize = 20 } = {}) {
  requireFirebase()

  const snapshot = await getDocs(
    query(collection(db, REVIEWS), orderBy('createdAt', 'desc'), limit(pageSize)),
  )

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
}

export async function updateReviewStatus(id, status) {
  requireFirebase()

  const update = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'approved') {
    update.approvedAt = serverTimestamp()
  }

  return updateDoc(doc(db, REVIEWS, id), update)
}
