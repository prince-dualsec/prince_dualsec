import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          /* Sits to the left of the AI launcher so the two never overlap. */
          className="fixed bottom-5 right-[4.25rem] sm:bottom-6 sm:right-24 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cyber-dark/80 border border-cyber-border/60 backdrop-blur-md flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors"
          aria-label="Back to top"
          title="Back to top"
        >
          <FiArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
