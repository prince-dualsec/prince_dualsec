import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiGithub, FiStar, FiGitBranch, FiExternalLink } from 'react-icons/fi'
import { githubConfig } from '../config/github'

function RepoCard({ repo, index, inView }) {
  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      className="glass-card lift sheen p-6 group block"
    >
      <div className="flex items-start justify-between mb-3">
        <FiGithub className="w-5 h-5 text-cyber-cyan group-hover:scale-110 transition-transform" />
        <FiExternalLink className="w-4 h-4 text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-lg font-semibold text-cyber-white mb-2 group-hover:text-cyber-cyan transition-colors font-mono">
        {repo.name}
      </h3>
      <p className="text-sm text-cyber-muted leading-relaxed mb-4 line-clamp-2">
        {repo.description || 'No description available.'}
      </p>
      <div className="flex items-center gap-4 text-xs text-cyber-muted">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{
              backgroundColor: getLanguageColor(repo.language)
            }} />
            {repo.language}
          </span>
        )}
        {repo.unverified ? (
          <span className="font-mono text-cyber-muted/50">stats unavailable</span>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <FiStar className="w-3 h-3" />
              {repo.stargazers_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <FiGitBranch className="w-3 h-3" />
              {repo.forks_count ?? 0}
            </span>
          </>
        )}
      </div>
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {repo.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="px-2 py-0.5 text-xs rounded bg-cyber-cyan/10 text-cyber-cyan/80 border border-cyber-cyan/20">
              {topic}
            </span>
          ))}
        </div>
      )}
    </motion.a>
  )
}

function getLanguageColor(lang) {
  const colors = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    'Jupyter Notebook': '#DA5B0B',
  }
  return colors[lang] || '#8b949e'
}

export default function GitHub() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })

  useEffect(() => {
    const controller = new AbortController()

    const describe = async (response) => {
      if (response.status === 403 || response.status === 429) {
        return 'GitHub API rate limit reached — try again in a few minutes'
      }
      if (response.status === 404) {
        return `GitHub user @${githubConfig.username} not found`
      }
      return `GitHub API responded with ${response.status}`
    }

    const load = async () => {
      try {
        const [repoRes, profileRes] = await Promise.all([
          fetch(`${githubConfig.apiBase}/users/${githubConfig.username}/repos?sort=updated&per_page=6`, { signal: controller.signal }),
          fetch(`${githubConfig.apiBase}/users/${githubConfig.username}`, { signal: controller.signal }),
        ])

        if (!repoRes.ok) throw new Error(await describe(repoRes))

        const data = await repoRes.json()
        // A non-array body means GitHub returned an error envelope with a 200.
        if (!Array.isArray(data)) throw new Error('Unexpected response from the GitHub API')

        setRepos(data)

        if (profileRes.ok) {
          const p = await profileRes.json()
          setProfile({
            followers: p.followers ?? 0,
            following: p.following ?? 0,
            publicRepos: p.public_repos ?? 0,
            stars: data.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
          })
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message)
        // Fall back to the configured repo list. No counts are shown for these,
        // because inventing stars and forks would be fabricating data.
        setRepos(githubConfig.pinnedRepos.map((name, i) => ({
          id: `pinned-${i}`,
          name,
          description: null,
          html_url: `https://github.com/${githubConfig.username}/${name}`,
          language: null,
          unverified: true,
        })))
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return (
    <section id="github" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// OPEN SOURCE</span>
          <h2 className="section-heading mt-2">GitHub</h2>
          <p className="section-subtitle">
            Check out my repositories and contributions
          </p>
        </motion.div>

        {/* Profile Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <a
            href={`https://github.com/${githubConfig.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 glass-card hover:border-cyber-cyan/30 transition-all duration-300 group"
          >
            <FiGithub className="w-6 h-6 text-cyber-cyan" />
            <span className="text-cyber-white font-mono">@{githubConfig.username}</span>
          </a>

          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6"
            >
              {[
                { label: 'Public Repos', value: profile.publicRepos },
                { label: 'Followers', value: profile.followers },
                { label: 'Following', value: profile.following },
                { label: 'Stars (recent)', value: profile.stars },
              ].map((stat) => (
                <div key={stat.label} className="glass-card px-4 py-3">
                  <div className="text-xl font-bold font-mono text-cyber-cyan">{stat.value}</div>
                  <div className="text-[10px] text-cyber-muted uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Repos Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-5 w-5 bg-cyber-dark rounded mb-3" />
                <div className="h-5 bg-cyber-dark rounded w-2/3 mb-2" />
                <div className="h-4 bg-cyber-dark rounded mb-1" />
                <div className="h-4 bg-cyber-dark rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-center">
                <p className="text-sm text-cyber-red font-mono">// {error}</p>
                <p className="text-xs text-cyber-muted mt-1">Showing configured repositories. Open GitHub for live details.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo, i) => (
                <RepoCard key={repo.id || repo.name} repo={repo} index={i} inView={inView} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
