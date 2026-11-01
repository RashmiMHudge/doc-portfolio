import { useCallback, useEffect, useRef, useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword } from 'firebase/auth'
import { collection, deleteDoc, getDocs } from 'firebase/firestore'
import { AlertTriangle, CalendarDays, Download, KeyRound, LayoutDashboard, LogOut, Menu, MessageCircle, RefreshCw, Star, Trash2, UsersRound, X, Mail, Phone } from 'lucide-react'
import { auth, db } from '../firebase/config.js'
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService.js'
import { getReviews, updateReviewStatus } from '../services/reviewService.js'
import { generateConsultationEmailBody, generateConsultationWhatsAppLink, generateWhatsAppReviewRequestLink, generateEmailReviewRequestBody } from '../services/notificationService.js'
import { updateConsultationReviewStatus } from '../services/consultationService.js'

const statuses = ['requested', 'confirmed', 'completed', 'cancelled']

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingData, setDeletingData] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordStatus, setPasswordStatus] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        setDeleteDialogOpen(false)
        setPasswordDialogOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!sidebarOpen && !passwordDialogOpen && !deleteDialogOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (sidebarOpen) sidebarRef.current?.querySelector('button')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen, passwordDialogOpen, deleteDialogOpen])

  async function exportAllData() {
    try {
      setExportingData(true)
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
    } finally {
      setExportingData(false)
    }
  }

  async function deleteAllData() {
    try {
      setDeletingData(true)
      setArchiveStatus('Deleting archived data...')
      const counts = await Promise.all(['appointments', 'reviews', 'reviewRequests', 'consultationSlots'].map(deleteCollectionData))
      setAppointments([])
      setReviews([])
      setArchiveStatus(`Deleted ${counts.reduce((total, count) => total + count, 0)} records.`)
      setDeleteDialogOpen(false)
      setDeleteConfirmation('')
    } catch (err) {
      setArchiveStatus(err.message || 'Unable to delete data.')
    } finally {
      setDeletingData(false)
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

  async function handlePasswordChange(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordStatus('')

    if (passwordForm.next.length < 6) {
      setPasswordError('Your new password must be at least 6 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('The new passwords do not match.')
      return
    }

    const user = auth?.currentUser
    if (!user?.email) {
      setPasswordError('Unable to identify the signed-in account. Please sign in again.')
      return
    }

    try {
      setPasswordSaving(true)
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, passwordForm.next)
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordStatus('Password updated successfully.')
    } catch (err) {
      setPasswordError(
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'The current password is incorrect.'
          : err.code === 'auth/weak-password'
            ? 'Choose a stronger password with at least 6 characters.'
            : err.message || 'Unable to update the password. Please try again.',
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth)
    } catch (err) {
      setError(err.message || 'Unable to sign out. Please try again.')
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
    <main className="admin-page" id="admin-overview">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Clinic Admin</p>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-account-menu">
          <button
            className="admin-menu-toggle"
            type="button"
            aria-label={sidebarOpen ? 'Close admin sidebar' : 'Open admin sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X size={21} /> : <Menu size={22} />}
          </button>
          {sidebarOpen ? (
            <div
              className="admin-sidebar-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSidebarOpen(false)
              }}
            >
              <aside className="admin-sidebar" id="admin-sidebar" ref={sidebarRef} aria-label="Admin sidebar">
                <div className="admin-sidebar-heading">
                  <div className="admin-menu-profile">
                    <span className="admin-avatar">{auth?.currentUser?.email?.[0]?.toUpperCase() || 'A'}</span>
                    <div>
                      <strong>Clinic administrator</strong>
                      <span>{auth?.currentUser?.email || 'Signed-in account'}</span>
                    </div>
                  </div>
                  <button className="admin-dialog-close" type="button" aria-label="Close admin sidebar" onClick={() => setSidebarOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <nav className="admin-sidebar-nav" aria-label="Dashboard sections">
                  <span className="admin-sidebar-label">Workspace</span>
                  <button type="button" onClick={() => { setSidebarOpen(false); document.getElementById('admin-overview')?.scrollIntoView({ behavior: 'smooth' }) }}>
                    <LayoutDashboard size={18} /> Overview
                  </button>
                  <button type="button" onClick={() => { setSidebarOpen(false); document.getElementById('admin-appointments')?.scrollIntoView({ behavior: 'smooth' }) }}>
                    <CalendarDays size={18} /> Appointments
                  </button>
                  <button type="button" onClick={() => { setSidebarOpen(false); document.getElementById('admin-reviews')?.scrollIntoView({ behavior: 'smooth' }) }}>
                    <UsersRound size={18} /> Patient reviews
                  </button>
                  <button type="button" onClick={() => { setSidebarOpen(false); loadAppointments(); loadReviews() }}>
                    <RefreshCw size={18} /> Refresh dashboard data
                  </button>
                </nav>

                <div className="admin-sidebar-nav">
                  <span className="admin-sidebar-label">Data management</span>
                  <button type="button" onClick={exportAllData} disabled={exportingData}>
                    <Download size={18} /> {exportingData ? 'Preparing export…' : 'Export clinic data'}
                  </button>
                  <p className="admin-sidebar-hint">Download appointments and reviews as separate CSV files.</p>
                  <div className="admin-sidebar-danger">
                    <strong>Danger zone</strong>
                    <p>Permanently remove clinic records. This action cannot be undone.</p>
                    <button className="admin-sidebar-delete" type="button" onClick={() => { setDeleteConfirmation(''); setDeleteDialogOpen(true) }}>
                      <Trash2 size={17} /> Delete clinic data
                    </button>
                  </div>
                  {archiveStatus ? <p className="archive-status" role="status">{archiveStatus}</p> : null}
                </div>

                <div className="admin-sidebar-account">
                  <span className="admin-sidebar-label">Account</span>
                  <button type="button" onClick={() => {
                    setSidebarOpen(false)
                    setPasswordDialogOpen(true)
                    setPasswordError('')
                    setPasswordStatus('')
                  }}>
                    <KeyRound size={18} /> Change password
                  </button>
                  <button className="admin-menu-logout" type="button" onClick={handleLogout}>
                    <LogOut size={18} /> Sign out
                  </button>
                </div>
              </aside>
            </div>
          ) : null}
          {deleteDialogOpen ? (
            <div className="admin-password-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDeleteDialogOpen(false)
            }}>
              <section className="admin-password-dialog admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title">
                <div className="admin-password-heading">
                  <div>
                    <span className="admin-delete-icon"><AlertTriangle size={21} /></span>
                    <p className="eyebrow">Irreversible action</p>
                    <h2 id="admin-delete-title">Delete clinic data?</h2>
                  </div>
                  <button type="button" className="admin-dialog-close" aria-label="Close dialog" onClick={() => setDeleteDialogOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <p className="admin-delete-copy">This permanently deletes all appointments, reviews, review requests, and reserved slots. Export anything you need before continuing.</p>
                <label className="admin-delete-confirm-label">
                  Type <strong>DELETE</strong> to confirm
                  <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" />
                </label>
                <div className="admin-password-actions">
                  <button className="secondary-button" type="button" onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
                  <button className="danger-button" type="button" disabled={deleteConfirmation !== 'DELETE' || deletingData} onClick={deleteAllData}>
                    <Trash2 size={17} /> {deletingData ? 'Deleting…' : 'Permanently delete'}
                  </button>
                </div>
              </section>
            </div>
          ) : null}
          {passwordDialogOpen ? (
            <div className="admin-password-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPasswordDialogOpen(false)
            }}>
              <section className="admin-password-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-password-title">
                <div className="admin-password-heading">
                  <div>
                    <p className="eyebrow">Account security</p>
                    <h2 id="admin-password-title">Change password</h2>
                  </div>
                  <button type="button" className="admin-dialog-close" aria-label="Close dialog" onClick={() => setPasswordDialogOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <p className="admin-password-account">{auth?.currentUser?.email}</p>
                <form className="admin-password-form" onSubmit={handlePasswordChange}>
                  <label>
                    Current password
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current}
                      onChange={(event) => setPasswordForm((form) => ({ ...form, current: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="6"
                      value={passwordForm.next}
                      onChange={(event) => setPasswordForm((form) => ({ ...form, next: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="6"
                      value={passwordForm.confirm}
                      onChange={(event) => setPasswordForm((form) => ({ ...form, confirm: event.target.value }))}
                      required
                    />
                  </label>
                  {passwordError ? <p className="form-error" role="alert">{passwordError}</p> : null}
                  {passwordStatus ? <p className="form-success" role="status">{passwordStatus}</p> : null}
                  <div className="admin-password-actions">
                    <button className="secondary-button" type="button" onClick={() => setPasswordDialogOpen(false)}>Cancel</button>
                    <button className="primary-button" type="submit" disabled={passwordSaving}>
                      {passwordSaving ? 'Updating…' : 'Update password'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : null}
        </div>
      </header>

      <section className="admin-stats" aria-label="Appointment status overview">
        {counts.map(([status, count]) => (
          <article key={status}>
            <span>{status}</span>
            <strong>{count}</strong>
          </article>
        ))}
      </section>

      <section className="admin-table-wrap" id="admin-appointments">
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
                    <td>{item.preferredTime ? `${item.preferredTime} IST` : item.startTime || 'Flexible'}</td>
                    <td>{item.consultationClient || 'To be confirmed'}</td>
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
                              href={generateConsultationWhatsAppLink(item.phone, item.patientName, item.date || item.preferredDate, item.preferredTime || item.startTime, item.message) || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-link-button admin-whatsapp-review"
                            >
                              <MessageCircle size={16} />
                              WhatsApp confirmation
                            </a>
                            {item.email ? (
                              <a
                                href={`mailto:${item.email}?subject=${encodeURIComponent(generateConsultationEmailBody(item.patientName, item.date || item.preferredDate, item.preferredTime || item.startTime, item.message).subject)}&body=${encodeURIComponent(generateConsultationEmailBody(item.patientName, item.date || item.preferredDate, item.preferredTime || item.startTime, item.message).body)}`}
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

      <section className="admin-table-wrap admin-reviews-wrap" id="admin-reviews">
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
