import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // querySelector throws on anything that is not a valid selector, and a
      // hash is whatever the address bar happens to contain — a bare "#" or a
      // fragment starting with a digit would take the whole page down.
      let element = null
      try {
        element = document.querySelector(hash)
      } catch {
        element = document.getElementById(hash.slice(1))
      }
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    if (pathname === '/contact' || pathname === '/contacts') {
      const element = document.getElementById('contact')
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
