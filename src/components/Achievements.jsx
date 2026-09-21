import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FaShieldAlt, FaBug, FaTerminal, FaTrophy, FaAward, FaClock, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa'
import { achievementsData } from '../config/achievements'

const iconMap = {
  shield: FaShieldAlt,
  bug: FaBug,
  terminal: FaTerminal,
  trophy: FaTrophy,
  award: FaAward,
}

const statusConfig = {
  'completed': { label: 'Completed', icon: FaCheckCircle, color: '#00ff88' },
  'in-progress': { label: 'In Progress', icon: FaClock, color: '#f97316' },
  'planned': { label: 'Planned', icon: FaCalendarAlt, color: '#79c0ff' },
}

function AchievementCard({ achievement, index, inView }) {
  const Icon = iconMap[achievement.icon] || FaAward
  const status = statusConfig[achievement.status] || statusConfig.planned

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      className="glass-card lift sheen p-6 group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${achievement.color}15`, border: `1px solid ${achievement.color}30` }}
        >
          <Icon className="w-7 h-7" style={{ color: achievement.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-lg font-semibold text-cyber-white">{achievement.title}</h3>
            <span
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
              style={{
                backgroundColor: `${status.color}15`,
                color: status.color,
                border: `1px solid ${status.color}30`,
              }}
            >
              <status.icon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-cyber-muted">{achievement.issuer}</p>
          {achievement.date && (
            <p className="text-xs text-cyber-muted/60 mt-1 font-mono">{achievement.date}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-cyber-text leading-relaxed">{achievement.description}</p>

      {achievement.credentialId && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-cyber-muted font-mono">ID: {achievement.credentialId}</span>
        </div>
      )}
    </motion.div>
  )
}

export default function Achievements() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="achievements" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// CREDENTIALS</span>
          <h2 className="section-heading mt-2">Achievements & Certifications</h2>
          <p className="section-subtitle">Professional certifications and milestones</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementsData.map((achievement, i) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={i}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
