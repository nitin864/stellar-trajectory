import { useEffect, useRef } from 'react'

// A quiet, ambient starfield. Purely decorative, respects reduced motion.
export default function Starfield() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let stars = []
    let animationFrame

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const count = Math.floor((canvas.width * canvas.height) / 9000)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.1 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0006 + 0.0002,
      }))
    }

    function draw(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        const twinkle = prefersReducedMotion ? 0 : Math.sin(time * s.speed + s.phase) * 0.35
        ctx.globalAlpha = Math.max(0, Math.min(1, s.baseAlpha + twinkle))
        ctx.fillStyle = '#E8E9F3'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!prefersReducedMotion) {
        animationFrame = requestAnimationFrame(draw)
      }
    }

    resize()
    draw(0)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
