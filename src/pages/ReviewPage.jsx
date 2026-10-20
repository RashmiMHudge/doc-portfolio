import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, ArrowLeft, Star, Loader2 } from 'lucide-react'
import { getReviewRequest, submitConsultationReview } from '../services/reviewService.js'
import { doctor } from '../data/doctor.js'

export default function ReviewPage() {
  const { consultationId: reviewToken } = useParams()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ rating: 5, feedback: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function loadConsultation() {
      try {
        setLoading(true)
        setError('')
        const request = await getReviewRequest(reviewToken)
        setConsultation(request)

        if (request.status !== 'requested') {
          setError('This consultation has not been completed yet. Reviews can only be submitted for completed consultations.')
        }
      } catch (err) {
        setError(err.message || 'Unable to load consultation details.')
      } finally {
        setLoading(false)
      }
    }

    if (reviewToken) {
      loadConsultation()
    }
  }, [reviewToken])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.feedback.trim()) {
      setError('Please share your feedback.')
      return
    }

    try {
      setSubmitting(true)
      await submitConsultationReview(reviewToken, {
        patientName: consultation.patientName,
        rating: form.rating,
        feedback: form.feedback,
      })
      setSubmitted(true)
    } catch (err) {
      if (err.message.includes('already been submitted')) {
        setError('Feedback has already been submitted for this consultation.')
      } else {
        setError(err.message || 'Unable to submit your review.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="review-page">
        <div className="review-loading">
          <Loader2 size={28} className="spin" />
          <p>Loading consultation details...</p>
        </div>
      </main>
    )
  }

  if (!consultation) {
    return (
      <main className="review-page">
        <div className="review-error">
          <p>Consultation not found.</p>
          <Link to="/" className="secondary-button">Return to home</Link>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="review-page">
        <div className="review-success">
          <div className="success-icon">✓</div>
          <h1>Thank you for your feedback</h1>
          <p>We appreciate your review. It has been submitted for moderation.</p>
          <Link to="/" className="primary-button">Return to home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="review-page">
      <div className="review-container">
        <Link to="/" className="review-back-link">
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <div className="review-card">
          <div className="review-header">
            <div className="review-doctor-badge">
              <strong>{doctor.name}</strong>
              <small>{doctor.credentials}</small>
            </div>
          </div>

          <h1>How was your consultation?</h1>
          <p className="review-subtitle">Your feedback helps us improve our service.</p>

          {error && <div className="review-error-message">{error}</div>}

          <form className="review-form" onSubmit={handleSubmit} noValidate>
            <div className="review-form-group">
              <label>Rating</label>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`star-button ${form.rating >= value ? 'active' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, rating: value }))}
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star size={24} fill={form.rating >= value ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <p className="star-label">
                {form.rating === 1 && 'Poor'}
                {form.rating === 2 && 'Fair'}
                {form.rating === 3 && 'Good'}
                {form.rating === 4 && 'Very Good'}
                {form.rating === 5 && 'Excellent'}
              </p>
            </div>

            <div className="review-form-group">
              <label htmlFor="feedback">
                Share your experience *
              </label>
              <textarea
                id="feedback"
                name="feedback"
                value={form.feedback}
                onChange={updateField}
                placeholder="Tell us about your consultation experience..."
                rows="6"
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button full" type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>

          <p className="review-privacy">Your feedback is valuable and helps us serve you better.</p>
        </div>
      </div>
    </main>
  )
}
