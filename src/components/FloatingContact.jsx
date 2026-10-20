import { CalendarCheck, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FloatingContact({ doctor }) {
  const whatsappUrl = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
    `Hello ${doctor.name}, I would like to book a consultation.`,
  )}`

  return (
    <div className="floating-contact" aria-label="Quick contact actions">
      <a href={`tel:${doctor.phone}`} aria-label="Call clinic"><Phone size={20} /></a>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Message on WhatsApp"><MessageCircle size={20} /></a>
      <Link to="/appointment" aria-label="Book appointment"><CalendarCheck size={20} /></Link>
    </div>
  )
}
