import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FaRocket, FaTerminal, FaGlobe, FaSearch, FaCode, FaShieldAlt } from 'react-icons/fa'
import { journeyData } from '../config/journey'

const iconMap = {
  rocket: FaRocket,
  terminal: FaTerminal,
  web: FaGlobe,
  search: FaSearch,
  code: FaCode,
  shield: FaShieldAlt,
}

function TimelineItem({ item, index, inView }) {
  const Icon = iconMap[item.icon] || FaRocket
  const isRight = item.side === 'right'

  return (
    <motion.div
      initial={{ opacity: 0, x: isRight ? 30 : -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      className={`relative flex items-start md:items-center gap-4 md:gap-0 ${
        isRight ? 'md:flex-row-reverse' : ''
      }`}
    >
      {/* Mobile marker — sits on the rail at left-6 so the line has something
          to anchor to. The w-12 wrapper centres the dot on that 24px rail. */}
      <div className="md:hidden relative z-10 shrink-0 w-12 flex justify-center pt-5">
        <div className="w-8 h-8 rounded-full bg-cyber-dark border-2 border-cyber-cyan/30 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-cyber-cyan" />
        </div>
      </div>

      {/* Content Card */}
      <div className={`flex-1 min-w-0 ${isRight ? 'md:pl-12' : 'md:pr-12'} ${isRight ? 'md:text-left' : 'md:text-right'}`}>
        <div className={`glass-card p-5 sm:p-6 ${isRight ? '' : 'md:ml-auto'} md:max-w-md`}>
          <div className="flex items-center gap-2 mb-2">
            {isRight && <div className="hidden md:block flex-1" />}
            <span className="text-xs font-mono px-2 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
              {item.year}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-cyber-white mb-2">{item.title}</h3>
          <p className="text-sm text-cyber-muted leading-relaxed">{item.description}</p>
        </div>
      </div>

      {/* Center Dot — desktop rail */}
      <div className="hidden md:flex items-center justify-center relative z-10">
        <div className="w-12 h-12 rounded-full bg-cyber-dark border-2 border-cyber-cyan/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyber-cyan" />
        </div>
      </div>

      {/* Spacer */}
      <div className="hidden md:block flex-1" />
    </motion.div>
  )
}

export default function Journey() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })

  return (
    <section id="journey" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// TIMELINE</span>
          <h2 className="section-heading mt-2">Security Journey</h2>
          <p className="section-subtitle">My path in cybersecurity</p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center Line - Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-cyan/20 via-cyber-cyan/30 to-cyber-cyan/20" />

          {/* Mobile Line */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-cyan/20 via-cyber-cyan/30 to-cyber-cyan/20" />

          <div className="space-y-8">
            {journeyData.map((item, i) => (
              <TimelineItem key={item.id} item={item} index={i} inView={inView} />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
