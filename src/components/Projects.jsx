import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiGithub, FiExternalLink, FiCode, FiArrowRight } from 'react-icons/fi'

import { projectsData, projectCategories } from '../config/projects'

function ProjectCard({ project, index, inView }) {
  const categoryColors = {
    security: '#ff4757',
    osint: '#00d4ff',
    web: '#00ff88',
    network: '#f97316',
  }
  const accent = categoryColors[project.category] || '#8b949e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      className="glass-card lift lift-strong sheen overflow-hidden group"
    >
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-cyber-dark to-cyber-black flex items-center justify-center overflow-hidden project-card-header">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <FiCode className="w-16 h-16 text-cyber-cyan/20 group-hover:text-cyber-cyan/40 transition-all duration-500 group-hover:scale-110" />
        
        {/* Category Badge */}
        <div
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${accent}15`,
            color: accent,
            border: `1px solid ${accent}30`,
          }}
        >
          {(project.category || 'other').toUpperCase()}
        </div>

        {/* Status Badge */}
        {project.status === 'in-progress' && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-cyber-orange/15 text-cyber-orange border border-cyber-orange/30">
            IN PROGRESS
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-cyber-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-cyber-white mb-2 group-hover:text-cyber-cyan transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-cyber-muted leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 text-xs rounded-md bg-cyber-dark border border-cyber-border text-cyber-text font-mono"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-cyber-dark/80 border border-cyber-border hover:border-cyber-cyan/30 text-cyber-text hover:text-cyber-cyan transition-all duration-300"
            >
              <FiGithub className="w-4 h-4" />
              Code
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all duration-300"
            >
              <FiExternalLink className="w-4 h-4" />
              Live Demo
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })

  const filteredProjects = activeCategory === 'all'
    ? projectsData
    : projectsData.filter(p => p.category === activeCategory)

  return (
    <section id="projects" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// PORTFOLIO</span>
          <h2 className="section-heading mt-2">Projects</h2>
          <p className="section-subtitle">Security tools, research, and open-source contributions</p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {projectCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                  : 'text-cyber-muted hover:text-cyber-white hover:bg-cyber-dark/50 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              inView={inView}
            />
          ))}
        </div>

        {/* View More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <a
            href="https://github.com/prince-dualsec?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyber-muted hover:text-cyber-cyan transition-colors group"
          >
            <span>View all repositories</span>
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
