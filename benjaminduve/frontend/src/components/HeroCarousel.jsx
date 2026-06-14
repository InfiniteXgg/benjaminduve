import { useCallback, useEffect, useRef, useState } from 'react'
import './HeroCarousel.css'

const SLIDES = [
  {
    id: 'invierno',
    title: 'Colección Invierno 2026',
    subtitle: 'Piezas exclusivas para la temporada',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #050810 45%, #000000 100%)',
  },
  {
    id: 'bolsos',
    title: 'Bolsos & Mochilas Personalizados',
    subtitle: 'Diseño a tu medida con acabados premium',
    gradient: 'linear-gradient(135deg, #1a0a28 0%, #120818 45%, #000000 100%)',
  },
  {
    id: 'artesanal',
    title: 'Calidad Artesanal Chilena',
    subtitle: 'Hecho a mano con materiales seleccionados',
    gradient: 'linear-gradient(135deg, #2a1f0a 0%, #151008 45%, #000000 100%)',
  },
]

const AUTOPLAY_MS = 5000

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef(null)
  const total = SLIDES.length

  const goTo = useCallback((index) => {
    setActiveIndex(((index % total) + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + total) % total)
  }, [total])

  useEffect(() => {
    if (paused) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [paused, total])

  useEffect(() => {
    const node = regionRef.current
    if (!node) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev])

  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      ref={regionRef}
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Destacados de Benjamin Duve"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false)
        }
      }}
    >
      <div className="hero-carousel-track">
        {SLIDES.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
            style={{ '--hero-slide-gradient': slide.gradient }}
            aria-hidden={index !== activeIndex}
          >
            <div className="hero-carousel-overlay" aria-hidden="true" />
            <div className="hero-carousel-content">
              <h2>{slide.title}</h2>
              <p>{slide.subtitle}</p>
              <button type="button" className="hero-carousel-cta" onClick={scrollToCatalog}>
                Ver catálogo
              </button>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="hero-carousel-control hero-carousel-control--prev"
        onClick={goPrev}
        aria-label="Slide anterior"
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-carousel-control hero-carousel-control--next"
        onClick={goNext}
        aria-label="Slide siguiente"
      >
        ›
      </button>

      <div className="hero-carousel-dots" role="tablist" aria-label="Seleccionar slide">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            className={`hero-carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
            aria-label={`Ir al slide ${index + 1}: ${slide.title}`}
            aria-selected={index === activeIndex}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  )
}
