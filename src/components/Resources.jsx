import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiExternalLink } from 'react-icons/fi'
import { resourcesData } from '../config/resources'

function ResourceCard({ item, index, inView }) {
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all duration-300 group"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-cyber-white group-hover:text-cyber-cyan transition-colors">
          {item.name}
        </div>
        <div className="text-xs text-cyber-muted mt-0.5">{item.description}</div>
      </div>
      <FiExternalLink className="w-4 h-4 text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4" />
    </motion.a>
  )
}

export default function Resources() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })

  return (
    <section id="resources" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// RESOURCES</span>
          <h2 className="section-heading mt-2">Security Tools & Resources</h2>
          <p className="section-subtitle">Recommended platforms, tools, and communities</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {resourcesData.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: catIndex * 0.1 }}
              className="glass-card p-4 sm:p-6"
            >
              <h3 className="text-lg font-semibold text-cyber-white mb-4">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, i) => (
                  <ResourceCard key={item.name} item={item} index={i} inView={inView} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
