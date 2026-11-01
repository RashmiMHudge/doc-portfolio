import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FloatingContact({ doctor }) {
  const contactRef = useRef(null)
  const [isOverlappingAbout, setIsOverlappingAbout] = useState(false)
  const whatsappUrl = `https://wa.me/${doctor.whatsapp}?text=${encodeURIComponent(
    `Hello ${doctor.name}, I would like to book a consultation.`,
  )}`

  useEffect(() => {
    let frameId
    const aboutContent = document.querySelector('.about-content')

    if (!aboutContent || !contactRef.current) return undefined

    const contentItems = aboutContent.querySelectorAll('p, .about-badges, .training-block')

    function checkOverlap() {
      frameId = undefined
      const contact = contactRef.current?.getBoundingClientRect()
      if (!contact) return

      const overlaps = [...contentItems].some((item) => {
        const content = item.getBoundingClientRect()
        return (
          content.left < contact.right &&
          content.right > contact.left &&
          content.top < contact.bottom &&
          content.bottom > contact.top
        )
      })

      setIsOverlappingAbout(overlaps)
    }

    function scheduleCheck() {
      if (frameId === undefined) frameId = window.requestAnimationFrame(checkOverlap)
    }

    const resizeObserver = new ResizeObserver(scheduleCheck)
    resizeObserver.observe(aboutContent)
    resizeObserver.observe(contactRef.current)
    window.addEventListener('scroll', scheduleCheck, { passive: true })
    window.addEventListener('resize', scheduleCheck)
    scheduleCheck()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', scheduleCheck)
      window.removeEventListener('resize', scheduleCheck)
      if (frameId !== undefined) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <div
      ref={contactRef}
      className={`floating-contact${isOverlappingAbout ? ' is-obstructed' : ''}`}
      aria-label="Quick contact actions"
      aria-hidden={isOverlappingAbout}
    >
      <a href={`tel:${doctor.phone}`} aria-label="Call clinic"><Phone size={20} /></a>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Message on WhatsApp"><MessageCircle size={20} /></a>
      <Link to="/appointment" aria-label="Book appointment"><CalendarCheck size={20} /></Link>
    </div>
  )
}
