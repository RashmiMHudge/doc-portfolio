import { doctor } from '../data/doctor.js'

const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173'

function normalizePhoneForWhatsApp(phone = '') {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('0') ? `91${digits.slice(1)}` : digits.startsWith('91') ? digits : `91${digits}`
}

export function generateReviewLink(reviewToken) {
  return `${SITE_URL}/review/${reviewToken}`
}

export function generateWhatsAppReviewRequestLink(patientPhone, patientName, reviewToken) {
  const safePhone = normalizePhoneForWhatsApp(patientPhone)
  if (!safePhone) return null

  const reviewLink = generateReviewLink(reviewToken)
  const message = `Hello ${patientName},

Thank you for consulting with Dr. ${doctor.name}.

We would appreciate your feedback about your consultation.

Please share your experience here:
${reviewLink}

Thank you.`

  return `https://wa.me/${safePhone}?text=${encodeURIComponent(message)}`
}

export function generateConsultationWhatsAppLink(patientPhone, patientName, date, startTime, endTime, problemDescription = '') {
  const safePhone = normalizePhoneForWhatsApp(patientPhone)
  if (!safePhone) return null

  const message = `Hello ${patientName},

Your consultation with ${doctor.name} is confirmed.
Date: ${date}
Time: ${startTime} - ${endTime}
Duration: 30 minutes
Problem description: ${problemDescription || 'Not provided'}

At the scheduled time, please open this WhatsApp chat and tap the video call icon. Please use a stable internet connection and join from a quiet, well-lit place.

Thank you.`

  return `https://wa.me/${safePhone}?text=${encodeURIComponent(message)}`
}

export function generateConsultationEmailBody(patientName, date, startTime, endTime, problemDescription = '') {
  return {
    subject: `Consultation confirmed with Dr. ${doctor.name}`,
    body: `Hello ${patientName},\n\nYour consultation with ${doctor.name} is confirmed.\nDate: ${date}\nTime: ${startTime} - ${endTime}\nDuration: 30 minutes\nProblem description: ${problemDescription || 'Not provided'}\n\nAt the scheduled time, please open this WhatsApp chat and tap the video call icon. Please use a stable internet connection and join from a quiet, well-lit place.\n\nThank you.`,
  }
}

export function generateEmailReviewRequestBody(patientName, reviewToken) {
  const reviewLink = generateReviewLink(reviewToken)
  return {
    subject: `We'd love your feedback about your consultation with Dr. ${doctor.name}`,
    body: `Hello ${patientName},

Thank you for consulting with Dr. ${doctor.name}.

We would appreciate it if you could share your feedback about your consultation.

Please share your feedback here:
${reviewLink}

Thank you.`,
  }
}

export function generateWhatsAppReminderLink(message, phone = null) {
  const targetPhone = phone ? normalizePhoneForWhatsApp(phone) : normalizePhoneForWhatsApp(doctor.whatsapp)
  if (!targetPhone) return null
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
}
