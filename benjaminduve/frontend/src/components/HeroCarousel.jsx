import { useCallback, useEffect, useRef, useState } from 'react'
import { storeApi } from '../api/storeApi'
import './HeroCarousel.css'

const FALLBACK_SLIDES = [
  {
    id: 'invierno',
    eyebrow: 'NUEVA COLECCION',
    title: 'Invierno 2026',
    cta: 'Ver catalogo',
    gradient: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)',
    image: '/bolsonegro.jpeg',
  },
  {
    id: 'bolsos',
    eyebrow: 'HECHO A MANO',
    title: 'Bolsos & Mochilas',
    cta: 'Descubrir',
    gradient: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
    image: '/bolsomulti.jpeg',
  },
  {
    id: 'artesanal',
    eyebrow: 'EDICION LIMITADA',
    title: 'Calidad Artesanal',
    cta: 'Explorar',
    gradient: 'linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 100%)',
    image: '/bolsorosa.jpeg',
  },
]

const AUTOPLAY_MS = 5000

export default function HeroCarousel() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef(null)
  const total = slides.length

  const goTo = useCallback((index) => {
    if (total === 0) return
    setActiveIndex(((index % total) + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    if (total === 0) return
    setActiveIndex((current) => (current + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    if (total === 0) return
    setActiveIndex((current) => (current - 1 + total) % total)
  }, [total])

  useEffect(() => {
    let mounted = true

    storeApi.listHeroSlides()
      .then((response) => {
        if (!mounted) return
        const apiSlides = (response.data || []).filter((slide) => slide.image)
        setSlides(apiSlides.map((slide, index) => ({
          ...slide,
          id: slide.id || `slide-${index}`,
          gradient: 'linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%)',
        })))
        setActiveIndex(0)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (paused || total <= 1) return undefined

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

  if (total === 0) return null

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
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
            style={{ '--hero-slide-gradient': slide.gradient }}
            aria-hidden={index !== activeIndex}
          >
            {slide.image && (
              <img
                src={slide.image}
                alt={slide.title}
                className="hero-carousel-bg"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            <div className="hero-carousel-overlay" aria-hidden="true" />
            <div className="hero-carousel-content">
              <span className="hero-carousel-eyebrow">{slide.eyebrow}</span>
              <h2>{slide.title}</h2>
              <button type="button" className="hero-carousel-cta" onClick={scrollToCatalog}>
                {slide.cta} <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel-control hero-carousel-control--prev"
            onClick={goPrev}
            aria-label="Slide anterior"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            className="hero-carousel-control hero-carousel-control--next"
            onClick={goNext}
            aria-label="Slide siguiente"
          >
            &rsaquo;
          </button>
        </>
      )}

      {total > 1 && (
        <div className="hero-carousel-dots" role="tablist" aria-label="Seleccionar slide">
          {slides.map((slide, index) => (
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
      )}
    </section>
  )
}
