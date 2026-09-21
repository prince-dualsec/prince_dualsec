import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaLock, FaExclamationTriangle } from 'react-icons/fa'
import { FiArrowLeft, FiHome } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Shield Icon */}
        <motion.div
          animate={{
            rotateY: [0, 360],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block mb-8"
        >
          <div className="w-24 h-24 rounded-2xl bg-cyber-red/10 border-2 border-cyber-red/30 flex items-center justify-center mx-auto relative">
            <FaLock className="w-10 h-10 text-cyber-red" />
            <div className="absolute -top-2 -right-2">
              <FaExclamationTriangle className="w-6 h-6 text-cyber-orange" />
            </div>
          </div>
        </motion.div>

        {/* Error Code */}
        <div className="font-mono mb-4">
          <span className="text-6xl sm:text-8xl font-bold text-gradient">404</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-cyber-white mb-4">
          Access Denied
        </h1>
        <p className="text-cyber-muted mb-2 font-mono text-sm">
          // ERROR: Resource not found in this sector
        </p>
        <p className="text-cyber-muted/70 mb-8">
          The page you're looking for has either been moved, deleted,
          or doesn't exist. It might have been classified.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <FiHome className="w-4 h-4" />
            Back to Base
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Decorative */}
        <div className="mt-12 font-mono text-xs text-cyber-muted/30 space-y-1">
          <p>HTTP/1.1 404 Not Found</p>
          <p>Content-Type: text/plain</p>
          <p>X-Security-Status: CLASSIFIED</p>
        </div>
      </motion.div>
    </div>
  )
}
