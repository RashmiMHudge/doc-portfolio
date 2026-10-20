import { useState } from 'react'
import { CalendarCheck, Loader2, Send } from 'lucide-react'

const initialForm = {
  patientName: '',
  phone: '',
  email: '',
  date: '',
  slotId: '',
  message: '',
}

function todayDateValue() {
  return new Date().toISOString().split('T')[0]
}

const consultationSlots = [
  ['17:00', '17:30'],
  ['17:30', '18:00'],
  ['18:00', '18:30'],
  ['18:30', '19:00'],
  ['19:00', '19:30'],
  ['19:30', '20:00'],
  ['20:00', '20:30'],
  ['20:30', '21:00'],
]

function validateForm(form) {
  const name = form.patientName.trim()
  const phone = form.phone.trim()
  const email = form.email.trim()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const indianPhonePattern = /^(?:\+91|91)?[6-9]\d{9}$/
  const errors = {}

  if (name.length < 2) {
    errors.patientName = 'Please enter the patient full name.'
  } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(name)) {
    errors.patientName = 'Please use only letters, spaces, apostrophes, and hyphens.'
  }

  if (!phone) {
    errors.phone = 'Phone number is required.'
  } else if (!indianPhonePattern.test(phone.replace(/\s+/g, ''))) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number.'
  }

  if (!email) {
    errors.email = 'Email address is required.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!form.date) {
    errors.preferredDate = 'Please choose a preferred date.'
  } else if (form.date < todayDateValue()) {
    errors.preferredDate = 'Please choose today or a future date.'
  }

  if (!form.slotId) {
    errors.preferredTime = 'Please choose an available 30-minute slot.'
  } else if (form.date === todayDateValue()) {
    const selectedSlot = consultationSlots.find(([start]) => start === form.slotId)
    if (selectedSlot) {
      const now = new Date()
      const selected = new Date(`${form.date}T${selectedSlot[0]}`)

      if (selected <= now) {
        errors.preferredTime = 'Please choose a future time.'
      }
    }
  }

  return errors
}

export default function AppointmentForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationErrors = validateForm(form)
    setFieldErrors(validationErrors)
    if (Object.values(validationErrors).some(Boolean)) {
      setError('Please fix the highlighted fields.')
      return
    }

    try {
      setStatus('loading')
      const { createAppointment } = await import('../services/appointmentService.js')
      await createAppointment(form)

      setStatus('success')
      setForm(initialForm)
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Unable to submit right now. Please call or WhatsApp the clinic.')
    }
  }

  return (
    <form className="appointment-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <CalendarCheck size={24} />
        <div>
          <h3>Request Appointment</h3>
          <p>Fields marked * are required.</p>
        </div>
      </div>

      <label>
        Full name *
        <input
          name="patientName"
          value={form.patientName}
          onChange={updateField}
          autoComplete="name"
          placeholder="Full name*"
          required
          minLength="2"
          aria-invalid={Boolean(fieldErrors.patientName)}
        />
        {fieldErrors.patientName ? <span className="field-error">{fieldErrors.patientName}</span> : null}
      </label>
      <label>
        Phone number *
        <input
          name="phone"
          value={form.phone}
          onChange={updateField}
          autoComplete="tel"
          inputMode="tel"
          placeholder="Phone number*"
          required
          minLength="10"
          maxLength="13"
          aria-invalid={Boolean(fieldErrors.phone)}
        />
        {fieldErrors.phone ? <span className="field-error">{fieldErrors.phone}</span> : null}
      </label>
      <label>
        Email *
        <input
          name="email"
          value={form.email}
          onChange={updateField}
          autoComplete="email"
          type="email"
          placeholder="Email *"
          required
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
      </label>
      <div className="form-row">
        <label>
          Preferred date *
          <input
            name="date"
            value={form.date}
            onChange={updateField}
            type="date"
            min={todayDateValue()}
            required
            aria-invalid={Boolean(fieldErrors.preferredDate)}
          />
          {fieldErrors.preferredDate ? <span className="field-error">{fieldErrors.preferredDate}</span> : null}
        </label>
        <label>
          Available time slot *
          <select name="slotId" value={form.slotId} onChange={updateField} required aria-invalid={Boolean(fieldErrors.preferredTime)}>
            <option value="">Select a 30-minute slot</option>
            {consultationSlots.map(([start, end]) => <option key={start} value={start}>{start} - {end}</option>)}
          </select>
          {fieldErrors.preferredTime ? <span className="field-error">{fieldErrors.preferredTime}</span> : null}
        </label>
      </div>
      <label>
        Problem description
        <textarea
          name="message"
          value={form.message}
          onChange={updateField}
          rows="4"
          placeholder="Briefly describe your concern or symptoms"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {status === 'success' ? (
        <p className="form-success">
          Your appointment request has been submitted. The clinic will contact you for confirmation.
        </p>
      ) : null}

      <button className="primary-button full" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        Request Appointment
      </button>
    </form>
  )
}
