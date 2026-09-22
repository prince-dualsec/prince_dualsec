import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import BootScreen from './components/BootScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import SecurityAnalysis from './components/SecurityAnalysis'
import ThreatFeed from './components/ThreatFeed'
import LiveTerminal from './components/LiveTerminal'
import Journey from './components/Journey'
import Achievements from './components/Achievements'
import GitHub from './components/GitHub'
import Resources from './components/Resources'
import Contact from './components/Contact'
import Footer from './components/Footer'
import NotFound from './components/NotFound'
import ScrollToTop from './components/ScrollToTop'
import CustomCursor from './components/CustomCursor'
import BackToTop from './components/BackToTop'
import HackerBackground from './components/HackerBackground'

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <SecurityAnalysis />
      <ThreatFeed />
      <LiveTerminal />
      <Journey />
      <Achievements />
      <GitHub />
      <Resources />
      <Contact />
    </>
  )
}

function AppContent() {
  const location = useLocation()
  const [booted, setBooted] = useState(false)

  const handleBootComplete = useCallback(() => {
    setBooted(true)
  }, [])

  return (
    <>
      <CustomCursor />
      {!booted && <BootScreen onComplete={handleBootComplete} />}
      {/* Fixed behind everything; the grid now lives in here rather than on
          the page shell, so content scrolls over a still backdrop. */}
      <HackerBackground />
      <div className={`page-shell min-h-screen transition-opacity duration-500 ${booted ? 'opacity-100' : 'opacity-0'}`}>
        <ScrollToTop />
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/contact" element={<HomePage />} />
            <Route path="/contacts" element={<HomePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <Footer />
        <BackToTop />
      </div>
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
