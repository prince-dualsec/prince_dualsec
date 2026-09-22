import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { skillsData, toolsData } from '../config/skills'


const tabs = [
  { id: 'offensive', label: 'Offensive' },
  { id: 'defensive', label: 'Defensive' },
  { id: 'osint', label: 'OSINT' },
  { id: 'networking', label: 'Networking' },
  { id: 'tools', label: 'Tools' },
]

function SkillBar({ name, level, color, delay, inView }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-cyber-text">{name}</span>
        <span className="text-xs font-mono text-cyber-muted">{level}%</span>
      </div>
      <div className="skill-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1, delay: delay, ease: 'easeOut' }}
          className="skill-fill"
          style={{ '--skill-color': color }}
        />
      </div>
    </div>
  )
}

function ToolCard({ tool, index, inView }) {
  const Icon = tool.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 flex items-center gap-3 group cursor-default"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${tool.color}15`, border: `1px solid ${tool.color}30` }}
      >
        <Icon className="w-5 h-5" style={{ color: tool.color }} />
      </div>
      <div>
        <div className="text-sm font-medium text-cyber-white">{tool.name}</div>
        <div className="text-xs text-cyber-muted">{tool.category}</div>
      </div>
    </motion.div>
  )
}

export default function Skills() {
  const [activeTab, setActiveTab] = useState('offensive')
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="skills" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// EXPERTISE</span>
          <h2 className="section-heading mt-2">Skills & Tools</h2>
          <p className="section-subtitle">My cybersecurity arsenal and technical proficiencies</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-cyber-muted hover:text-cyber-white hover:bg-cyber-dark/50 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {activeTab !== 'tools' && skillsData[activeTab] && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-5 sm:p-8 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              {(() => {
                const Icon = skillsData[activeTab].icon
                return <Icon className="w-6 h-6" style={{ color: skillsData[activeTab].color }} />
              })()}
              <h3 className="text-xl font-semibold text-cyber-white">{skillsData[activeTab].title}</h3>
            </div>
            <div className="space-y-5">
              {skillsData[activeTab].skills.map((skill, i) => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  level={skill.level}
                  color={skillsData[activeTab].color}
                  delay={i * 0.1}
                  inView={inView}
                />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'tools' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {toolsData.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} index={i} inView={inView} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
