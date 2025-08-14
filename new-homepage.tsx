import Link from 'next/link'
import { useState } from 'react'

// Local data arrays
const projects = [
  {
    title: "Gaza Rebuild Tracker",
    summary: "Real-time infrastructure damage assessment and rebuilding progress",
    status: "Active",
    href: "/projects/gaza-rebuild",
    tags: ["Infrastructure", "Data"]
  },
  {
    title: "Advocacy Campaign Manager",
    summary: "Tools for organizing grassroots political campaigns",
    status: "Beta",
    href: "/projects/campaign-manager",
    tags: ["Organizing", "Politics"]
  },
  {
    title: "Community Resource Network",
    summary: "Connect Palestinian families with local mutual aid resources",
    status: "Launch Ready",
    href: "/projects/resource-network",
    tags: ["Community", "Aid"]
  },
  {
    title: "Digital Rights Toolkit",
    summary: "Privacy and security tools for activists and journalists",
    status: "Development",
    href: "/projects/digital-rights",
    tags: ["Privacy", "Security"]
  }
]

const kpis = [
  { label: "Projects Launched", value: "47" },
  { label: "Volunteers Matched", value: "230+" },
  { label: "Capital Directed", value: "$2.8M" },
  { label: "Active Partners", value: "85" }
]

const partners = [
  { name: "Code for Palestine" },
  { name: "Palestine Open Maps" },
  { name: "Digital Justice Fund" },
  { name: "Solidarity Tech Collective" },
  { name: "Liberation Labs" },
  { name: "Impact Partners Network" }
]

// Icons as inline SVG components
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const RocketIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Tech for Palestine - Home"
            >
              Tech for Palestine
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/about" className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2">
                About
              </Link>
              <Link href="/incubator" className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2">
                Incubator
              </Link>
              <Link href="/projects" className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2">
                Projects
              </Link>
              <Link href="/get-involved" className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2">
                Get Involved
              </Link>
              <Link href="/donate" className="bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-md px-4 py-2 font-medium">
                Donate
              </Link>
            </div>
          </div>

          {/* Language Toggle and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <button 
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Switch language"
            >
              <GlobeIcon />
              <span className="text-sm">EN</span>
            </button>
            
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-2"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link 
                href="/about" 
                className="block text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/incubator" 
                className="block text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Incubator
              </Link>
              <Link 
                href="/projects" 
                className="block text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </Link>
              <Link 
                href="/get-involved" 
                className="block text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Involved
              </Link>
              <Link 
                href="/donate" 
                className="block bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-md px-3 py-2 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Donate
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

// Hero Section
const Hero = () => (
  <section className="bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Incubating advocacy projects for a free Palestine.
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            We connect mission-driven entrepreneurs with mentorship, resources, and funding partners.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/incubator/apply"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
            >
              Apply to the Incubator
              <ChevronRightIcon />
            </Link>
            <Link
              href="/investors"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-red-600 bg-white border-2 border-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
            >
              Invest or Support
              <ChevronRightIcon />
            </Link>
          </div>
          
          <div className="mt-4">
            <Link
              href="/volunteer"
              className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Volunteer with us
              <ChevronRightIcon />
            </Link>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-md h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <HeartIcon />
              <p className="mt-4 text-gray-600">Community solidarity illustration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Who/What/How Section
const WhoWhatHow = () => (
  <section className="bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <UsersIcon />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Who We Help</h3>
          <p className="text-gray-600 leading-relaxed">
            Entrepreneurs and advocates building tools for liberation.
          </p>
          <Link 
            href="/about#who-we-help" 
            className="mt-4 inline-flex items-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            Learn more
            <ChevronRightIcon />
          </Link>
        </div>
        
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <BuildingIcon />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">What We Do</h3>
          <p className="text-gray-600 leading-relaxed">
            Incubate projects, mentor leaders, connect to capital and networks.
          </p>
          <Link 
            href="/incubator" 
            className="mt-4 inline-flex items-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            See our process
            <ChevronRightIcon />
          </Link>
        </div>
        
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <RocketIcon />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">How to Start</h3>
          <p className="text-gray-600 leading-relaxed">
            Apply, meet mentors, launch with ongoing support.
          </p>
          <Link 
            href="/incubator/apply" 
            className="mt-4 inline-flex items-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            Start applying
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </div>
  </section>
)

// Featured Projects Section
const FeaturedProjects = () => (
  <section className="bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Projects</h2>
        <p className="text-lg text-gray-600">
          Real advocacy tools making impact today
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {projects.map((project, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {project.title}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                project.status === 'Active' ? 'bg-green-100 text-green-800' :
                project.status === 'Beta' ? 'bg-blue-100 text-blue-800' :
                project.status === 'Launch Ready' ? 'bg-purple-100 text-purple-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {project.summary}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {project.tags.map((tag, tagIndex) => (
                <span key={tagIndex} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {tag}
                </span>
              ))}
            </div>
            
            <Link
              href={project.href}
              className="inline-flex items-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1 text-sm font-medium"
            >
              View project
              <ChevronRightIcon />
            </Link>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <Link
          href="/projects"
          className="inline-flex items-center px-6 py-3 text-base font-medium text-red-600 bg-white border-2 border-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
        >
          See all projects
          <ChevronRightIcon />
        </Link>
      </div>
    </div>
  </section>
)

// Impact & Network Section
const ImpactNetwork = () => (
  <section className="bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Impact</h2>
          <div className="grid grid-cols-2 gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{kpi.value}</div>
                <div className="text-sm text-gray-600">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Network</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partners.map((partner, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <span className="text-gray-700 font-medium">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Incubator Process Section
const IncubatorProcess = () => (
  <section className="bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How the Incubator Works</h2>
        <p className="text-lg text-gray-600">
          From idea to impact in three focused steps
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-red-600">1</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Apply</h3>
          <p className="text-gray-600">
            Share your advocacy project idea and vision for impact.
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-green-600">2</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Build with mentors</h3>
          <p className="text-gray-600">
            Work closely with experienced founders and domain experts.
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-blue-600">3</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Launch & grow</h3>
          <p className="text-gray-600">
            Deploy your project with ongoing support and network access.
          </p>
        </div>
      </div>
    </div>
  </section>
)

// Final CTA Section
const FinalCTA = () => (
  <section className="bg-red-600">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start your advocacy project with Tech for Palestine
          </h2>
          <Link
            href="/incubator/apply"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-red-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600 rounded-md"
          >
            Apply Now
            <ChevronRightIcon />
          </Link>
        </div>
        
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-white mb-4">
            Want to help projects succeed?
          </h2>
          <Link
            href="/investors"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white border-2 border-white hover:bg-white hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600 rounded-md"
          >
            Partner With Us
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </div>
  </section>
)

// Footer Component
const Footer = () => (
  <footer className="bg-gray-900" role="contentinfo">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Stay Connected</h3>
          <form className="space-y-3" aria-label="Email newsletter signup">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-describedby="email-description"
            />
            <p id="email-description" className="text-sm text-gray-400">
              Get updates on new projects and opportunities
            </p>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
            >
              Subscribe
            </button>
          </form>
        </div>
        
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Tech for Palestine is a 501(c)(3) nonprofit organization. 
            Tax ID: 12-3456789. Donations are tax-deductible to the full extent allowed by law.
          </p>
        </div>
        
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
              aria-label="Twitter"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
              aria-label="GitHub"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-800 pt-8">
        <p className="text-center text-gray-400 text-sm">
          © 2024 Tech for Palestine. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
)

// Skip to content link
const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-red-600 text-white px-4 py-2 z-50 focus:outline-none focus:ring-2 focus:ring-red-500"
  >
    Skip to main content
  </a>
)

// Main Page Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SkipLink />
      <Header />
      
      <main id="main-content">
        <Hero />
        <WhoWhatHow />
        <FeaturedProjects />
        <ImpactNetwork />
        <IncubatorProcess />
        <FinalCTA />
      </main>
      
      <Footer />
    </div>
  )
}