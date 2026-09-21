export const projectsData = [
  {
    id: 1,
    title: "Web Vulnerability Scanner",
    description:
      "Automated web application security scanner that detects common vulnerabilities including XSS, SQL injection, CSRF, and more. Built with Python and requests library.",
    image: null,
    technologies: ["Python", "Flask", "BeautifulSoup", "SQLMap"],
    category: "security",
    github: "https://github.com/prince-dualsec/web-vuln-scanner",
    live: null,
    featured: true,
    status: "completed",
  },
  {
    id: 2,
    title: "OSINT Recon Framework",
    description:
      "Comprehensive OSINT reconnaissance framework for gathering intelligence from multiple open sources. Includes username enumeration, email lookup, and domain analysis.",
    image: null,
    technologies: ["Python", "OSINT APIs", "CLI"],
    category: "osint",
    github: "https://github.com/prince-dualsec/osint-recon",
    live: null,
    featured: true,
    status: "completed",
  },
  {
    id: 3,
    title: "Network Traffic Analyzer",
    description:
      "Real-time network traffic analysis tool that captures and analyzes packets for suspicious activity and potential security threats.",
    image: null,
    technologies: ["Python", "Scapy", "Wireshark", "Pandas"],
    category: "network",
    github: "https://github.com/prince-dualsec/network-analyzer",
    live: null,
    featured: false,
    status: "completed",
  },
  {
    id: 4,
    title: "Security Dashboard",
    description:
      "Interactive cybersecurity dashboard displaying security metrics, threat alerts, and vulnerability reports in a clean modern interface.",
    image: null,
    technologies: ["React", "Tailwind CSS", "Chart.js", "REST API"],
    category: "web",
    github: "https://github.com/prince-dualsec/security-dashboard",
    live: "https://prince-dualsec.github.io/security-dashboard",
    featured: true,
    status: "completed",
  },
  {
    id: 5,
    title: "Password Strength Analyzer",
    description:
      "Tool to analyze password strength, detect common patterns, and check against breached password databases using Have I Been Pwned API.",
    image: null,
    technologies: ["Python", "Hashlib", "API Integration"],
    category: "security",
    github: "https://github.com/prince-dualsec/password-analyzer",
    live: null,
    featured: false,
    status: "completed",
  },
  {
    id: 6,
    title: "Malware Analysis Sandbox",
    description:
      "Isolated environment for safe malware analysis and behavior monitoring. Tracks file system changes, registry modifications, and network activity.",
    image: null,
    technologies: ["Python", "Docker", "YARA", "Linux"],
    category: "security",
    github: "https://github.com/prince-dualsec/malware-sandbox",
    live: null,
    featured: false,
    status: "in-progress",
  },
];

export const projectCategories = [
  { id: "all", label: "All Projects" },
  { id: "security", label: "Security Tools" },
  { id: "osint", label: "OSINT" },
  { id: "web", label: "Web Apps" },
  { id: "network", label: "Network" },
];
