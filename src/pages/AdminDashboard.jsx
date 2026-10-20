import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, deleteDoc, getDocs } from 'firebase/firestore'
import { CalendarDays, LogOut, RefreshCw, Star, MessageCircle, Mail, Phone } from 'lucide-react'
import { auth, db } from '../firebase/config.js'
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService.js'
import { getReviews, updateReviewStatus } from '../services/reviewService.js'
import { generateConsultationEmailBody, generateConsultationWhatsAppLink, generateWhatsAppReviewRequestLink, generateEmailReviewRequestBody } from '../services/notificationService.js'
import { updateConsultationReviewStatus } from '../services/consultationService.js'

const statuses = ['requested', 'confirmed', 'completed', 'cancelled']

function getEndTime(startTime = '') {
  const [hours, minutes] = startTime.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
  const endMinutes = hours * 60 + minutes + 30
  return `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
}

function getReviewStatusLabel(status) {
  const labels = {
    not_requested: 'Not Requested',
    requested: 'Requested',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status] || status
}

function exportCsv(filename, rows) {
  if (rows.length === 0) {
    alert(`No ${filename.replace('.csv', '')} data to export.`)
    return
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const escapeCell = (value) => {
    if (value && typeof value.toDate === 'function') value = value.toDate().toISOString()
    if (value === null || value === undefined) return ''
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

async function getAllCollectionData(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

async function deleteCollectionData(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)))
  return snapshot.size
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([])
  const [reviews, setReviews] = useState([])
  const [cursor, setCursor] = useState(null)
  const cursorRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [archiveStatus, setArchiveStatus] = useState('')

  async function exportAllData() {
    try {
      setArchiveStatus('Preparing exports...')
      const [appointmentRows, reviewRows] = await Promise.all([
        getAllCollectionData('appointments'),
        getAllCollectionData('reviews'),
      ])
      const date = new Date().toISOString().slice(0, 10)
      exportCsv(`appointments-${date}.csv`, appointmentRows)
      exportCsv(`reviews-${date}.csv`, reviewRows)
      setArchiveStatus(`Exported ${appointmentRows.length} appointments and ${reviewRows.length} reviews.`)
    } catch (err) {
      setArchiveStatus(err.message || 'Unable to export data.')
    }
  }

  async function deleteAllData() {
    const confirmed = window.confirm('Export the data first. Permanently delete all appointments, reviews, review requests, and reserved slots? This cannot be undone.')
    if (!confirmed) return
    try {
      setArchiveStatus('Deleting archived data...')
      const counts = await Promise.all(['appointments', 'reviews', 'reviewRequests', 'consultationSlots'].map(deleteCollectionData))
      setAppointments([])
      setReviews([])
      setArchiveStatus(`Deleted ${counts.reduce((total, count) => total + count, 0)} records.`)
    } catch (err) {
      setArchiveStatus(err.message || 'Unable to delete data.')
    }
  }

  const loadAppointments = useCallback(async ({ append = false } = {}) => {
    try {
      setLoading(true)
      setError('')
      const result = await getAppointments({ cursor: append ? cursorRef.current : null })
      setAppointments((current) => (append ? [...current, ...result.items] : result.items))
      cursorRef.current = result.cursor
      setCursor(result.cursor)
    } catch (err) {
      setError(err.message || 'Unable to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReviews = useCallback(async () => {
    try {
      setReviewsLoading(true)
      setReviewError('')
      const items = await getReviews({ pageSize: 50 })
      setReviews(items)
    } catch (err) {
      setReviewError(err.message || 'Unable to load reviews.')
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  async function changeStatus(id, status) {
    try {
      setError('')
      await updateAppointmentStatus(id, status)
      setAppointments((current) => current.map((item) => (
        item.id === id
          ? { ...item, status, ...(status === 'completed' ? { reviewStatus: 'requested' } : {}) }
          : item
      )))
    } catch (err) {
      setError(err.message || 'Unable to update appointment status.')
    }
  }

  async function changeReviewStatus(id, status) {
    await updateReviewStatus(id, status)
    setReviews((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  async function requestReviewViaWhatsApp(appointment) {
    try {
      const link = generateWhatsAppReviewRequestLink(appointment.phone, appointment.patientName, appointment.id)
      
      if (link && link !== '#') {
        await updateConsultationReviewStatus(appointment.id, 'requested')
        setAppointments((current) =>
          current.map((item) =>
            item.id === appointment.id ? { ...item, reviewStatus: 'requested' } : item,
          ),
        )
        window.open(link, '_blank')
      } else {
        alert('Invalid phone number. Please update the patient phone before sending a review request.')
      }
    } catch (err) {
      alert(err.message || 'Unable to send review request.')
    }
  }

  async function requestReviewViaEmail(appointment) {
    try {
      const emailData = generateEmailReviewRequestBody(appointment.patientName, appointment.id)
      
      await updateConsultationReviewStatus(appointment.id, 'requested')
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, reviewStatus: 'requested' } : item,
        ),
      )
      
      const mailto = `mailto:${appointment.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
      window.location.href = mailto
    } catch (err) {
      alert(err.message || 'Unable to send review request via email.')
    }
  }

  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => {
    // oxlint-disable-next-line react(set-state-in-effect)
    loadAppointments()
    // oxlint-disable-next-line react(set-state-in-effect)
    loadReviews()
  }, [loadAppointments, loadReviews])

  const counts = statuses.map((status) => [
    status,
    appointments.filter((item) => item.status === status).length,
  ])

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Clinic Admin</p>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" type="button" onClick={() => loadAppointments()}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="ghost-button" type="button" onClick={() => signOut(auth)}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <section className="admin-stats">
        {counts.map(([status, count]) => (
          <article key={status}>
            <span>{status}</span>
            <strong>{count}</strong>
          </article>
        ))}
      </section>

      <section className="admin-archive-panel">
        <div>
          <p className="eyebrow">Monthly archive</p>
          <h2>Export clinic data</h2>
          <p>Downloads complete appointments and reviews as separate CSV files that open in Excel.</p>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" type="button" onClick={exportAllData}>Export Excel files</button>
          <button className="danger-button" type="button" onClick={deleteAllData}>Delete archived data</button>
        </div>
        {archiveStatus ? <p className="archive-status">{archiveStatus}</p> : null}
      </section>

      <section className="admin-table-wrap">
        <div className="table-heading">
          <CalendarDays size={22} />
          <h2>Latest appointments</h2>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {loading && appointments.length === 0 ? <p>Loading appointments...</p> : null}
        {!loading && appointments.length === 0 && !error ? <p>No appointments found.</p> : null}
        {appointments.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.patientName}</strong>
                      <span>{item.email || 'No email'}</span>
                    </td>
                    <td>{item.phone}</td>
                    <td>{item.date || item.preferredDate || 'Flexible'}</td>
                    <td>{item.startTime || item.preferredTime || 'Flexible'}</td>
                    <td>{item.consultationClient || 'WhatsApp'}</td>
                    <td><span className={`status-pill ${item.status}`}>{item.status}</span></td>
                    <td><span className={`status-pill review-${item.reviewStatus || 'not_requested'}`}>{getReviewStatusLabel(item.reviewStatus || 'not_requested')}</span></td>
                    <td>
                      <div className="admin-action-stack">
                        <a href={`tel:${item.phone}`} className="admin-link-button">
                          <Phone size={16} />
                          Call patient
                        </a>
                        {item.status === 'requested' ? (
                          <>
                            <button type="button" className="admin-link-button admin-whatsapp-review" onClick={() => changeStatus(item.id, 'confirmed')}>Confirm</button>
                            <button type="button" className="admin-link-button" onClick={() => changeStatus(item.id, 'cancelled')}>Cancel</button>
                          </>
                        ) : null}
                        {item.status === 'confirmed' ? (
                          <>
                            <a
                              href={generateConsultationWhatsAppLink(item.phone, item.patientName, item.date || item.preferredDate, item.startTime || item.preferredTime, item.endTime || getEndTime(item.startTime || item.preferredTime), item.message) || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-link-button admin-whatsapp-review"
                            >
                              <MessageCircle size={16} />
                              WhatsApp confirmation
                            </a>
                            {item.email ? (
                              <a
                                href={`mailto:${item.email}?subject=${encodeURIComponent(generateConsultationEmailBody(item.patientName, item.date || item.preferredDate, item.startTime || item.preferredTime, item.endTime || getEndTime(item.startTime || item.preferredTime), item.message).subject)}&body=${encodeURIComponent(generateConsultationEmailBody(item.patientName, item.date || item.preferredDate, item.startTime || item.preferredTime, item.endTime || getEndTime(item.startTime || item.preferredTime), item.message).body)}`}
                                className="admin-link-button admin-email-review"
                              >
                                <Mail size={16} />
                                Email confirmation
                              </a>
                            ) : null}
                            <button type="button" className="admin-link-button" onClick={() => changeStatus(item.id, 'completed')}>Mark Completed</button>
                          </>
                        ) : null}
                        {item.status === 'completed' && (item.reviewStatus === 'requested' || item.reviewStatus === 'not_requested' || item.reviewStatus === undefined) ? (
                          <>
                            <button
                              type="button"
                              className="admin-link-button admin-whatsapp-review"
                              onClick={() => requestReviewViaWhatsApp(item)}
                            >
                              <MessageCircle size={16} />
                              Request Review
                            </button>
                            {item.email ? (
                              <button
                                type="button"
                                className="admin-link-button admin-email-review"
                                onClick={() => requestReviewViaEmail(item)}
                              >
                                <Mail size={16} />
                                Email Review
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {cursor ? (
          <button className="secondary-button load-more" type="button" onClick={() => loadAppointments({ append: true })}>
            Load More
          </button>
        ) : null}
      </section>

      <section className="admin-table-wrap admin-reviews-wrap">
        <div className="table-heading">
          <Star size={22} />
          <h2>Patient reviews</h2>
        </div>
        {reviewError ? <p className="form-error">{reviewError}</p> : null}
        {reviewsLoading && reviews.length === 0 ? <p>Loading reviews...</p> : null}
        {!reviewsLoading && reviews.length === 0 && !reviewError ? <p>No reviews found.</p> : null}
        {reviews.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Rating</th>
                  <th>Review Text</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.patientName || item.name || 'Anonymous'}</strong>
                    </td>
                    <td>
                      {item.rating ? (
                        <span className="rating-stars">
                          {'★'.repeat(item.rating)}
                          {'☆'.repeat(5 - item.rating)}
                        </span>
                      ) : (
                        <span>–</span>
                      )}
                    </td>
                    <td>
                      <p className="review-text-preview">
                        {item.feedback || item.reviewText || item.quote || 'No text'}
                      </p>
                    </td>
                    <td><span className={`status-pill ${item.status || 'pending'}`}>{item.status || 'pending'}</span></td>
                    <td>
                      <select value={item.status || 'pending'} onChange={(event) => changeReviewStatus(item.id, event.target.value)}>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}
