import { FiGithub, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi'
import { siteConfig } from '../config/site'
import Logo from './Logo'

const links = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#security-lab', label: 'Security Lab' },
  { href: '#threat-feed', label: 'Threat Feed' },
  { href: '#playbook', label: 'Playbook' },
  { href: '#journey', label: 'Journey' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#github', label: 'GitHub' },
  { href: '#resources', label: 'Resources' },
  { href: '#contact', label: 'Contact' },
]

const socials = [
  { href: siteConfig.github, icon: FiGithub, label: 'GitHub' },
  { href: siteConfig.linkedin, icon: FiLinkedin, label: 'LinkedIn' },
  { href: `mailto:${siteConfig.email}`, icon: FiMail, label: 'Email' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-cyber-border/50 bg-cyber-black/50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
                <Logo className="w-4 h-4 text-cyber-cyan" />
              </div>
              <span className="font-bold text-cyber-white font-mono">{siteConfig.username}</span>
            </a>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Securing the digital world, one vulnerability at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-cyber-white mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); const id = link.href.substring(1); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }) }}
                  className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div>
            <h4 className="text-sm font-semibold text-cyber-white mb-4">Connect</h4>
            <div className="flex gap-3">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  {...(!href.startsWith('mailto:') && { target: '_blank', rel: 'noopener noreferrer' })}
                  className="w-10 h-10 rounded-lg bg-cyber-dark/50 border border-cyber-border/50 flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cyber-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cyber-muted/50 font-mono">
            &copy; {currentYear} {siteConfig.username}. All rights reserved.
          </p>
          <p className="text-xs text-cyber-muted/30 font-mono flex items-center gap-1">
            Built with <FiHeart className="w-3 h-3 text-cyber-red" /> for cybersecurity
          </p>
        </div>
      </div>
    </footer>
  )
}
