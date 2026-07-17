import { Link } from '@tanstack/react-router'
import { Library, BarChart2, Users, Settings, Sun, Moon, LogIn, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('skill-maker-theme') === 'dark' || 
                       (!('skill-maker-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const navItems = [
    { icon: Library, label: 'Library', to: '/library' },
    { icon: BarChart2, label: 'Benchmarks', to: '/benchmarks' },
    { icon: Users, label: 'Community', to: '/explore' },
  ]

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('skill-maker-theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('skill-maker-theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <div 
      className={`relative flex flex-col justify-between border-r border-border bg-card transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} h-full shrink-0`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground z-10"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <div className="flex flex-col flex-1 py-10 overflow-hidden">
        <nav className="flex flex-col gap-2 px-3">
          {navItems.map((item, idx) => (
            <Link 
              key={idx}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors group whitespace-nowrap"
              activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium" }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={`text-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 p-3 border-t border-border">
        <button 
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className={`text-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            Settings
          </span>
        </button>

        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap"
        >
          {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
          <span className={`text-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <div className="px-3 py-2.5 flex items-center gap-3 whitespace-nowrap">
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-5 h-5 shrink-0" } }} />
            <span className={`text-sm text-muted-foreground transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              Account
            </span>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors w-full">
                <LogIn className="h-5 w-5 shrink-0" />
                <span className={`text-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Log In
                </span>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  )
}
