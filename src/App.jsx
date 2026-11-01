import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import {
  Award,
  CalendarCheck,
  HeartPulse,
  Mail,
  Microscope,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from 'lucide-react'
import AppointmentForm from './components/AppointmentForm.jsx'
import FloatingContact from './components/FloatingContact.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { doctor } from './data/doctor.js'
import { getApprovedReviews } from './services/reviewService.js'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'))

function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(
      '.hero-copy, .hero-media, .stats-band, .section-heading, .split-section > div, .list-card, .service-card, .quote-panel, .care-grid article, .testimonial-card, .faq-list details, .contact-copy, .appointment-form, .education-card',
    )

    elements.forEach((element) => element.classList.add('reveal-item'))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -48px 0px' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])
}

const navItems = [
  ['About', '#about'],
  ['Health Education', '#health-education'],
  ['Skills', '#skills'],
  ['Area of Expertise', '#area-of-expertise'],
  ['Care', '#care'],
  ['Reviews', '#reviews'],
  ['Contact', '#contact'],
]

function InstagramMark({ size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

const stats = [
  ['12+', 'Years clinical experience'],
  ['4+', 'Years oncology focus'],
  ['AIR 80', 'Super speciality rank'],
  ['7+', 'Research publications'],
]

const educationTopics = [
  {
    number: '01',
    category: 'Know the signs',
    title: 'Five gynecological cancers',
    image: '/images/education/gynecological-cancer-signs.svg',
    imageAlt: 'Illustration of the uterus with highlighted gynecological health areas',
    summary: 'Cervical, ovarian, uterine, vulval and vaginal cancers can have different warning signs. Persistent or unusual symptoms deserve attention.',
    points: [
      'Notice unexpected bleeding or persistent discharge.',
      'Pay attention to ongoing bloating or pelvic discomfort.',
      'Seek advice for persistent vulval itching, sores or skin changes.',
    ],
    nextStep: 'Cervical screening does not screen for every gynecological cancer.',
  },
  {
    number: '02',
    category: 'Ovarian health',
    title: 'An ovarian cyst is not automatically cancer',
    image: '/images/education/ovarian-cyst-awareness.svg',
    imageAlt: 'Illustration showing a small fluid-filled ovarian cyst beside a healthy ovary',
    summary: 'Many ovarian cysts are benign and may resolve without treatment. The right next step depends on ultrasound findings, symptoms, age and menopausal status.',
    points: [
      'Not every cyst needs surgery.',
      'Your clinician can explain whether monitoring or further assessment is appropriate.',
      'Sudden, severe pelvic pain needs urgent medical care.',
    ],
    nextStep: 'Have persistent symptoms or an ultrasound finding assessed.',
  },
  {
    number: '03',
    category: 'When to seek care',
    title: 'Bleeding after menopause',
    image: '/images/education/bleeding-after-menopause.svg',
    imageAlt: 'Illustration of a calendar and a care conversation about postmenopausal bleeding',
    summary: 'Menopause is generally reached after 12 months without a period. Any bleeding after menopause—even one episode of spotting—should be discussed with a clinician.',
    points: [
      'Many causes are not cancer and can be treated.',
      'Bleeding can sometimes signal a problem with the womb lining.',
      'Assessment may include an ultrasound or biopsy, depending on your situation.',
    ],
    nextStep: 'Arrange a gynaecology appointment rather than waiting for another episode.',
  },
  {
    number: '04',
    category: 'Family history',
    title: 'Cancer risk can come from either side',
    image: '/images/education/family-history.svg',
    imageAlt: 'Illustration of a family tree connecting relatives on both sides of a family',
    summary: 'A family history of ovarian cancer, breast cancer at a young age, or a known inherited gene change on either your mother’s or father’s side may be worth discussing.',
    points: [
      'Write down which relatives had cancer and their ages at diagnosis.',
      'Your clinician can advise whether genetic counselling is appropriate.',
      'CA-125 and pelvic ultrasound are not reliable routine ovarian cancer screening tests.',
    ],
    nextStep: 'Share your family history with your doctor; testing is not right for everyone.',
  },
  {
    number: '05',
    category: 'Cervical health',
    title: 'A positive HPV test is not a cancer diagnosis',
    image: '/images/education/hpv-positive.svg',
    imageAlt: 'Illustration of HPV particles and a clinician discussing a screening result',
    summary: 'HPV is common, and many infections clear naturally. A positive result means you should follow the care plan recommended for your test and circumstances.',
    points: [
      'Keep your result and discuss it with your gynaecologist.',
      'Follow recommended repeat testing or examination.',
      'A test cannot tell when HPV was acquired or from whom.',
    ],
    nextStep: 'Don’t panic or skip follow-up—ask your clinician what your result means.',
  },
  {
    number: '06',
    category: 'Treatment & fertility',
    title: 'Ask about fertility before treatment starts',
    image: '/images/education/fertility-preservation.svg',
    imageAlt: 'Illustration of a patient discussing fertility-preservation options with a clinician',
    summary: 'Some cancer treatments can affect fertility. Depending on the cancer and treatment plan, fertility-preservation options may be available.',
    points: [
      'Ask your cancer team about fertility as early as possible.',
      'Options may include egg or embryo freezing or fertility-sparing treatment for selected patients.',
      'Suitability depends on your diagnosis and treatment plan.',
    ],
    nextStep: 'Discuss your priorities with your cancer team before treatment; never delay treatment without medical advice.',
  },
]

const skillGroups = [
  {
    number: '01',
    title: 'Gynecologic Oncology Surgery',
    icon: Scissors,
    items: [
      'Cytoreductive surgery for ovarian cancer',
      'Advanced laparoscopic surgery for ovarian cancer',
      'Radical hysterectomy for cervical cancer',
      'Advanced laparoscopic surgery for endometrial cancer',
      'Vulval cancer surgery',
      'Laparoscopic sentinel lymph node biopsy',
    ],
  },
  {
    number: '02',
    title: 'Minimally Invasive Gynecology',
    icon: Microscope,
    items: [
      'Laparoscopic surgery for uterine fibroids',
      'Laparoscopic surgery for adenomyosis',
      'Laparoscopic surgery for endometriosis',
    ],
  },
  {
    number: '03',
    title: 'Preventive & Diagnostic Care',
    icon: ShieldCheck,
    items: ['Pap smear', 'Colposcopy', 'HPV vaccination'],
  },
]

const expertiseCategories = [
  {
    number: '01',
    title: 'Gynecologic Oncology',
    description: 'Specialized care for gynecologic cancers.',
    items: [
      {
        name: 'Ovarian Cancer',
        summary: 'A gynecologic cancer that may develop with subtle or persistent symptoms and requires appropriate evaluation.',
        riskTitle: 'Risk factors',
        riskFactors: ['Increasing age', 'Family history', 'BRCA1/BRCA2 mutations', 'Lynch syndrome', 'Certain reproductive factors'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Persistent bloating', 'Pelvic discomfort', 'Feeling full quickly', 'Urinary changes', 'Unexplained fatigue'],
        note: 'If symptoms are persistent or unusual for you, specialist evaluation may be appropriate.',
      },
      {
        name: 'Cervical Cancer',
        summary: 'A preventable cancer that is often detected through screening and timely assessment of concerning symptoms.',
        riskTitle: 'Risk factors',
        riskFactors: ['Persistent HPV infection', 'Smoking history', 'Irregular screening', 'Immune-related factors'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Unexpected bleeding', 'Persistent discharge', 'Pelvic pain', 'Post-coital bleeding'],
        note: 'Any persistent or unexplained symptoms should be reviewed by a specialist.',
      },
      {
        name: 'Endometrial Cancer',
        summary: 'A uterine cancer that may present with changes in bleeding patterns and should be evaluated early.',
        riskTitle: 'Risk factors',
        riskFactors: ['Age-related risk', 'Obesity', 'Hormonal imbalance', 'Prior abnormal uterine findings'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Abnormal bleeding', 'Heavy periods', 'Postmenopausal bleeding', 'Pelvic pressure'],
        note: 'Persistent bleeding changes, especially after menopause, should be assessed promptly.',
      },
      {
        name: 'Uterine Sarcoma',
        summary: 'A rare uterine tumor that may overlap with other gynecologic conditions and needs careful evaluation.',
        riskTitle: 'Risk factors',
        riskFactors: ['Prior pelvic radiation', 'Complex uterine conditions', 'Persistent symptoms despite treatment'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Abnormal bleeding', 'Pelvic pain', 'Enlarging uterus', 'Worsening pelvic symptoms'],
        note: 'If symptoms remain unexplained or progressive, specialist review may be appropriate.',
      },
      {
        name: 'Vaginal Cancer',
        summary: 'A less common gynecologic cancer that may present with persistent local symptoms and should be evaluated early.',
        riskTitle: 'Risk factors',
        riskFactors: ['HPV exposure', 'Abnormal cervical findings', 'Smoking history'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Persistent bleeding', 'Vaginal discharge', 'Pelvic discomfort', 'Urinary irritation'],
        note: 'Ongoing vaginal symptoms or bleeding that does not settle need specialist assessment.',
      },
      {
        name: 'Vulval Cancer',
        summary: 'A skin-related gynecologic cancer that may begin with persistent irritation or visible changes.',
        riskTitle: 'Risk factors',
        riskFactors: ['Persistent irritation', 'HPV-related factors', 'Smoking history'],
        symptomsTitle: 'Warning symptoms',
        symptoms: ['Persistent itching', 'Vulvar sore', 'Pain or burning', 'Skin thickening'],
        note: 'New or persistent vulvar changes should be reviewed with a specialist.',
      },
    ],
  },
  {
    number: '02',
    title: 'General Gynecology',
    description: 'Diagnosis and treatment of common benign gynecologic conditions.',
    items: [
      {
        name: 'Uterine Fibroids',
        summary: 'Common non-cancerous uterine growths that may cause heavy bleeding or pelvic pressure.',
        riskTitle: 'Risk factors',
        riskFactors: ['Age-related factors', 'Hormonal influences', 'Family history'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Heavy periods', 'Pelvic pressure', 'Frequent urination', 'Abdominal cramps'],
        note: 'If bleeding or pressure affects daily life, specialist review may help.',
      },
      {
        name: 'Adenomyosis',
        summary: 'A condition in which endometrial tissue grows into the uterine muscle and may worsen pain or bleeding.',
        riskTitle: 'Risk factors',
        riskFactors: ['Age-related uterine changes', 'Hormonal influences'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Heavy periods', 'Painful periods', 'Lower abdominal pain', 'Pelvic fullness'],
        note: 'Persistent heavy or painful periods deserve careful evaluation.',
      },
      {
        name: 'Endometriosis',
        summary: 'A chronic condition where tissue similar to the uterine lining can grow outside the uterus and cause pain.',
        riskTitle: 'Risk factors',
        riskFactors: ['Family history', 'Reproductive age', 'Persistent pelvic pain'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Painful periods', 'Pelvic pain', 'Pain during intercourse', 'Fertility concerns'],
        note: 'Persistent pelvic pain or infertility concerns are good reasons to seek specialist care.',
      },
      {
        name: 'Ovarian Tumors',
        summary: 'Ovarian masses may be benign or require further evaluation depending on symptoms and findings.',
        riskTitle: 'Risk factors',
        riskFactors: ['Ovarian cysts', 'Family history', 'Persistent symptoms'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Bloating', 'Pelvic heaviness', 'Pressure symptoms', 'Abdominal swelling'],
        note: 'Ongoing ovarian symptoms should be assessed to clarify the next step.',
      },
      {
        name: 'Vaginal Infections',
        summary: 'Common vaginal irritation or discharge issues that may need evaluation when recurrent or persistent.',
        riskTitle: 'Risk factors',
        riskFactors: ['Recent antibiotics', 'Recurrent irritation', 'Uncertain diagnosis'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Itching', 'Discharge changes', 'Burning', 'Persistent irritation'],
        note: 'Recurring symptoms or symptoms not settling with usual care are worth reviewing.',
      },
      {
        name: 'Pelvic Inflammatory Disease (PID)',
        summary: 'An infection of the reproductive organs that can cause pelvic pain and should be assessed promptly.',
        riskTitle: 'Risk factors',
        riskFactors: ['STIs', 'Recurrent infection', 'Persistent pelvic discharge'],
        symptomsTitle: 'Common concerns',
        symptoms: ['Lower abdominal pain', 'Pain during intercourse', 'Unusual discharge', 'Fever'],
        note: 'Pelvic pain, discharge, or fever should be assessed promptly.',
      },
    ],
  },
  {
    number: '03',
    title: 'Preventive Oncology',
    description: 'Prevention, screening, and early detection.',
    items: [
      {
        name: 'Cervical Cancer Screening',
        summary: 'Routine screening helps detect early changes before they become cancer.',
        riskTitle: 'Risk factors',
        riskFactors: ['HPV exposure', 'Prior abnormal results', 'Smoking history'],
        symptomsTitle: 'When to review',
        symptoms: ['Abnormal bleeding', 'Persistent discharge', 'Past screening gaps'],
        note: 'Regular screening is an important part of preventive care and early detection.',
      },
      {
        name: 'Colposcopy',
        summary: 'A focused procedure used to evaluate abnormal screening results or concerning symptoms.',
        riskTitle: 'Why it matters',
        riskFactors: ['Abnormal Pap', 'High-risk HPV', 'Previous abnormal findings'],
        symptomsTitle: 'When it may help',
        symptoms: ['Persistent symptoms', 'Abnormal screening', 'Ongoing discomfort'],
        note: 'If screening is abnormal or symptoms persist, colposcopy may help clarify next steps.',
      },
      {
        name: 'HPV Vaccination',
        summary: 'A preventive measure that helps reduce HPV-related disease and supports cervical cancer prevention.',
        riskTitle: 'Why it matters',
        riskFactors: ['Helps prevent HPV disease', 'Supports cervical cancer prevention'],
        symptomsTitle: 'Who may benefit',
        symptoms: ['Eligible adolescents', 'Unvaccinated adults', 'Age-appropriate prevention'],
        note: 'Vaccination timing depends on age, health history, and individual risk factors.',
      },
    ],
  },
]

const faqs = [
  ['Do I need a referral?', 'No. You can request a consultation directly, and the clinic team will guide you.'],
  ['Can I book a second opinion?', 'Yes. Please bring prior scans, biopsy reports, discharge summaries, and prescriptions.'],
  ['Is the form for medical emergencies?', 'No. For urgent symptoms or emergencies, call the hospital or emergency services.'],
  ['Will my details be private?', 'The enquiry collects only basic contact details needed for scheduling.'],
]

const getWhatsAppUrl = (phone, name) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${name}, I would like to book a consultation.`)}`

function ConsultationModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="consultation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <h2 id="consultation-modal-title">Book your consultation</h2>
            <p>
              Share a few details with {doctor.name}'s team. The clinic will get back quickly.
            </p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close consultation form">
            <X size={18} />
          </button>
        </div>
        <AppointmentForm variant="modal" />
      </section>
    </div>
  )
}

function ExpertiseModal({ isOpen, onClose, condition, onBook }) {
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.body.classList.add('modal-open')
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !condition) return null

  const riskItems = condition.riskFactors || []
  const symptomItems = condition.symptoms || []

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="expertise-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expertise-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="expertise-modal-header">
          <div>
            <p className="eyebrow expertise-modal-eyebrow">AREAS OF EXPERTISE</p>
            <h2 id="expertise-modal-title">{condition.name}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close condition information">
            <X size={18} />
          </button>
        </div>

        <div className="expertise-modal-body">
          <p className="expertise-modal-summary">{condition.summary}</p>

          <div className="expertise-modal-grid">
            {riskItems.length > 0 && (
              <div className="expertise-modal-panel">
                <h3>{condition.riskTitle || 'Risk factors'}</h3>
                <ul>
                  {riskItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {symptomItems.length > 0 && (
              <div className="expertise-modal-panel">
                <h3>{condition.symptomsTitle || 'Warning symptoms'}</h3>
                <ul>
                  {symptomItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {condition.note && <p className="expertise-modal-note">{condition.note}</p>}

          <button
            className="primary-button full expertise-cta"
            type="button"
            onClick={() => {
              onClose()
              onBook?.()
            }}
          >
            Book an Consultation
          </button>
        </div>
      </section>
    </div>
  )
}

function Header({ onBook }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const sectionHref = (href) => (onBook ? href : `/${href}`)

  const handleBrandClick = (event) => {
    event.preventDefault()
    window.location.href = '/'
  }

  const toggleMenu = () => setIsMenuOpen((open) => !open)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label={`${doctor.name} home`} onClick={handleBrandClick}>
        <span className="brand-mark">GR</span>
        <span className="brand-text">
          <strong>{doctor.name}</strong>
          <small>{doctor.credentials}</small>
        </span>
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map(([label, href]) => (
          <a href={sectionHref(href)} key={label}>{label}</a>
        ))}
      </nav>

      <div className="header-actions">
        {onBook ? (
          <button className="primary-button compact header-book-button" type="button" onClick={onBook}>
            Book
          </button>
        ) : (
          <Link className="primary-button compact header-book-button" to="/appointment">
            Book
          </Link>
        )}

        <button
          className={`icon-button mobile-only menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {isMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(([label, href]) => (
            <a href={sectionHref(href)} key={label} onClick={closeMenu}>{label}</a>
          ))}
          {onBook ? (
            <button type="button" onClick={() => { closeMenu(); onBook(); }}>
              Book Consultation
            </button>
          ) : (
            <Link to="/appointment" onClick={closeMenu}>Book Consultation</Link>
          )}
        </nav>
      )}
    </header>
  )
}

function Home() {
  useScrollReveal()
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)
  const [activeCondition, setActiveCondition] = useState(null)
  const [reviews, setReviews] = useState([])

  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => {
    const hasSeenConsultationModal = sessionStorage.getItem('consultationModalShown') === 'true'

    if (!hasSeenConsultationModal) {
      sessionStorage.setItem('consultationModalShown', 'true')
      setIsConsultationOpen(true)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadReviews() {
      try {
        const items = await getApprovedReviews({ pageSize: 3 })
        if (isMounted) {
          // oxlint-disable-next-line react(set-state-in-effect)
          setReviews(items)
        }
      } catch {
        if (isMounted) {
          setReviews([])
        }
      }
    }

    loadReviews()

    return () => {
      isMounted = false
    }
  }, [])

  const whatsappUrl = getWhatsAppUrl(doctor.whatsapp, doctor.name)

  return (
    <>
      <Header onBook={() => setIsConsultationOpen(true)} />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">{doctor.title}</p>
            <h1 className="hero-title">
              <span>Precision in care,</span>
              <span>kindness in</span>
              <span className="hero-title-accent">every conversation.</span>
            </h1>
            <p className="hero-summary">
              Specialist gynecologic oncology consultations designed around you — helping you understand complex diagnoses, navigate treatment decisions, and move forward with clarity and confidence.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => setIsConsultationOpen(true)}>
                <CalendarCheck size={20} />
                Book a Consultation
              </button>
              <a className="secondary-button" href={`tel:${doctor.phone}`}>
                <Phone size={19} />
                Call {doctor.displayPhone}
              </a>
            </div>
          </div>

          <div className="hero-media" aria-label={`${doctor.name} profile visual`}>
            <img
              src="/images/Drgraja2.jpeg"
              alt="Doctor in a consultation room"
            />
            <div className="hero-badge">
              <span className="hero-badge-value">12+</span>
              <span className="hero-badge-copy">Years of clinical experience</span>
            </div>
          </div>
        </section>

        <section className="stats-band" aria-label="Professional highlights">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <div className="values-marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>Clarity</span>
            <span className="marquee-separator">✦</span>
            <span>Personalized Care</span>
            <span className="marquee-separator">✦</span>
            <span>Expert Guidance</span>
            <span className="marquee-separator">✦</span>
            <span>Informed Decisions</span>
            <span className="marquee-separator">✦</span>
            <span>Trusted Support</span>
            <span className="marquee-separator">✦</span>
            <span>Women's Wellbeing</span>
            <span className="marquee-separator">✦</span>
            <span>Clarity</span>
            <span className="marquee-separator">✦</span>
            <span>Personalized Care</span>
            <span className="marquee-separator">✦</span>
            <span>Expert Guidance</span>
            <span className="marquee-separator">✦</span>
            <span>Informed Decisions</span>
            <span className="marquee-separator">✦</span>
            <span>Trusted Support</span>
            <span className="marquee-separator">✦</span>
            <span>Women's Wellbeing</span>
          </div>
        </div>

        <section className="section about-section" id="about">
          <div className="about-intro">
            <p className="eyebrow">ABOUT THE DOCTOR</p>
            <h2 className="about-title">
              <span className="about-line">Expertise that guides,</span>
              <span className="about-line about-line-italic">care</span>
              <span className="about-line">that listens.</span>
            </h2>

            <div className="about-side-quote" aria-label="Doctor philosophy">
              <span className="quote-diamond">◆</span>
              <p>
                A thoughtful approach<br />
                to every consultation.
              </p>
              <ul>
                <li>Clear explanations.</li>
                <li>Individualized guidance.</li>
                <li>Evidence-led decisions.</li>
              </ul>
              <div className="about-signature">-- Dr. G Raja</div>
            </div>
          </div>

          <div className="about-content">
            <p className="about-lead">
              Dr. G Raja is a Gynecological Oncologist specializing in the diagnosis and treatment of
              gynecological cancers and complex gynecological conditions. He completed his MBBS and MD
              in Obstetrics and Gynaecology from AIIMS Bhubaneswar, followed by DNB in Obstetrics and
              Gynaecology and DrNB in Gynecological Oncology from Tata Medical Centre, Kolkata.
            </p>
            <p>
              He is a Fellow of Minimal Access Surgery (FMAS), and his approach to care combines specialist
              expertise with clear communication and individualized treatment planning. Through each online
              consultation, he takes time to understand the patient&apos;s concerns, explain the diagnosis and
              available treatment options, and provide evidence-based guidance for the next step in care.
            </p>
            <p>
              Alongside gynecologic oncology, his practice includes general gynecology and preventive
              oncology, with a focus on early detection, cervical cancer screening, colposcopy, and HPV vaccination.
            </p>

            <div className="about-badges">
              <div className="badge-card">
                <Award size={20} />
                <span>M.Ch. Gynecologic Oncology, AIMS Kochi</span>
              </div>
              <div className="badge-card">
                <Award size={20} />
                <span>ESGO - FMAS - IAPC Certified</span>
              </div>
              <div className="badge-card">
                <Award size={20} />
                <span>AIRO 80 - NEET-SS Super Speciality</span>
              </div>
            </div>

            <div className="training-block">
              <p className="training-label">Training &amp; Fellowships</p>
              <ul className="training-list">
                <li>Amrita Institute of Medical Sciences (AIMS), Kochi - M.Ch. Gynecologic Oncology</li>
                <li>Tata Memorial Hospital, Mumbai - Clinical observership in complex oncology surgery</li>
                <li>Tata Medical Center, Kolkata - Contemporary evidence-based treatment strategies</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section education-section" id="health-education">
          <div className="education-heading">
            <p className="eyebrow">WOMEN&apos;S HEALTH EDUCATION</p>
            <h2>Clear information.<br /><em>Confident next steps.</em></h2>
            <p>
              Explore approachable guides to gynecological cancer awareness, symptoms, screening
              and treatment conversations—created to help you know what to ask and when to seek care.
            </p>
          </div>

          <div className="education-grid">
            {educationTopics.map((topic) => (
              <article className="education-card" key={topic.number}>
                <img
                  className="education-card-image"
                  src={topic.image}
                  alt={topic.imageAlt}
                  loading="lazy"
                />
                <div className="education-card-meta">
                  <span className="education-card-icon"><HeartPulse size={18} /></span>
                  <span>{topic.category}</span>
                  <span className="education-card-number">{topic.number}</span>
                </div>
                <h3>{topic.title}</h3>
                <p className="education-card-summary">{topic.summary}</p>
                <ul>
                  {topic.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <p className="education-next-step"><strong>Keep in mind</strong>{topic.nextStep}</p>
              </article>
            ))}
          </div>

          <p className="education-disclaimer">
            This information is for general education only and cannot replace a consultation or
            personalized medical advice. If symptoms are persistent, unusual or severe, contact a
            qualified healthcare professional.
          </p>
        </section>

        <section className="section skills-section" id="skills">
          <div className="skills-header">
            <p className="eyebrow">CLINICAL SKILLS</p>
            <h2>Specialized care,<br />precise expertise.</h2>
            <p className="skills-subtitle">A focused approach to gynecologic oncology, minimally invasive surgery, and preventive care.</p>
          </div>

          <div className="skills-content">
            {skillGroups.map((group) => {
              const Icon = group.icon

              return (
                <article
                  key={group.title}
                  className={`skills-card ${group.number === '01' ? 'skills-card-featured' : ''}`}
                >
                  <div className="skills-card-top">
                    <span className="skills-card-icon">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <span className="skills-card-number">{group.number}</span>
                  </div>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="section expertise-explorer" id="area-of-expertise">
          <div className="expertise-header">
            <p className="eyebrow">AREAS OF EXPERTISE</p>
            <h2>Expertise across<br />gynecologic care.</h2>
            <p className="expertise-subtitle">
              Explore gynecologic cancers, common gynecologic conditions, and preventive care to understand your concerns and when specialist guidance may be helpful.
            </p>
          </div>

          <div className="expertise-layout">
            {expertiseCategories.map((category) => (
              <article className="expertise-category" key={category.title}>
                <div className="expertise-category-header">
                  <span className="expertise-category-number">{category.number}</span>
                  <div>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>
                </div>

                <div className="expertise-items">
                  {category.items.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      className="expertise-item"
                      onClick={() => setActiveCondition(item)}
                    >
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section philosophy-section" id="care">
          <div className="quote-panel">
            <Sparkles size={26} />
            <blockquote>
              Care begins with listening, then moves with clarity, expertise, and compassion.
            </blockquote>
          </div>
          <div className="care-grid">
            {[
              ['01', 'Listening first', 'Every consultation begins by understanding your concerns, questions, medical history, and what matters most to you.'],
              ['02', 'Clarity in every decision', 'Complex diagnoses and treatment options are explained clearly, so you can make informed choices with confidence.'],
              ['03', 'Expertise grounded in evidence', 'Recommendations are guided by current medical evidence, specialist expertise, and the individual needs of each patient..'],
              ['04', 'Care beyond the diagnosis', 'Treatment is only one part of the journey. Recovery, quality of life, prevention, and long-term wellbeing matter too.'],
            ].map(([number, title, body]) => (
              <article key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="section-heading">
            <p className="eyebrow">Patient Voices</p>
            <h2>Care that feels clear, human, and steady.</h2>
          </div>
          <div className="testimonial-grid">
            {reviews.length > 0 ? reviews.map((review) => {
              const displayName = review.patientName || 'Anonymous patient'
              const displayText = review.feedback || review.reviewText
              const rating = review.rating

              return (
                <article className="testimonial-card" key={review.id}>
                  <div className="stars" aria-label={`${rating} star review`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p>{displayText}</p>
                  <strong>{displayName}</strong>
                  <span>Verified consultation</span>
                </article>
              )
            }) : <p className="reviews-empty">Patient reviews will appear here after approval.</p>}
          </div>
        </section>

        <section className="section faq-section">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Common consultation questions.</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="contact-copy">
            <p className="eyebrow">Book a Consultation</p>
            <h2>Share a few details. The clinic team will contact you.</h2>
            <div className="contact-cards">
              <a href={`tel:${doctor.phone}`}><Phone size={20} /><span>Call</span><strong>{doctor.displayPhone}</strong></a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><Stethoscope size={20} /><span>WhatsApp</span><strong>{doctor.displayPhone}</strong></a>
              <a href={`mailto:${doctor.email}`}><Mail size={20} /><span>Email</span><strong>{doctor.email}</strong></a>
            </div>
          </div>
          <AppointmentForm />
        </section>
      </main>
      <Footer />
      <FloatingContact doctor={doctor} />
      <ExpertiseModal
        isOpen={Boolean(activeCondition)}
        condition={activeCondition}
        onClose={() => setActiveCondition(null)}
        onBook={() => setIsConsultationOpen(true)}
      />
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </>
  )
}

function AppointmentPage() {
  useScrollReveal()

  return (
    <>
      <Header />
      <main className="standalone-page">
        <section className="appointment-shell">
          <div>
            <p className="eyebrow">Consultation Request</p>
            <h1>Book your consultation</h1>
            <p>
              Send your preferred date and consultation type. The clinic will call back to confirm
              availability.
            </p>
          </div>
          <AppointmentForm />
        </section>
      </main>
      <FloatingContact doctor={doctor} />
    </>
  )
}

function Footer() {
  const whatsappUrl = getWhatsAppUrl(doctor.whatsapp, doctor.name)

  return (
    <footer className="site-footer">
      <div className="footer-brand-block">
        <strong className="footer-doctor-name">{doctor.name}</strong>
        <p className="footer-specialization">{doctor.credentials}</p>
      </div>

      <div>
        <span>Explore</span>
        {navItems.map(([label, href]) => (
          <a href={href} key={label}>{label}</a>
        ))}
        <Link to="/login" className="footer-admin-link">Admin</Link>
      </div>

      <div>
        <span>Contact</span>
        <a className="footer-contact-link" href={`tel:${doctor.phone}`}><Phone size={16} />{doctor.displayPhone}</a>
        <a className="footer-contact-link" href={whatsappUrl} target="_blank" rel="noreferrer"><Stethoscope size={16} />WhatsApp</a>
        <a className="footer-contact-link" href={`mailto:${doctor.email}`}><Mail size={16} />{doctor.email}</a>
        <a className="footer-contact-link" href="https://www.instagram.com/gyn_cancer_doc/" target="_blank" rel="noopener noreferrer"><InstagramMark size={16} />Follow on Instagram</a>
      </div>

      <div className="footer-note">
        <span>© 2026 {doctor.name}. All rights reserved.</span>
        <span>Educational information only — not a substitute for professional medical advice.</span>
      </div>
    </footer>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointment" element={<AppointmentPage />} />
        <Route
          path="/review/:consultationId"
          element={
            <Suspense fallback={<main className="center-page">Loading...</main>}>
              <ReviewPage />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<main className="center-page">Loading...</main>}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<main className="center-page">Loading...</main>}>
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
