'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navigation() {
  const { user, isAdmin, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/teams', label: 'Teams' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/standings', label: 'Standings' },
    { href: '/newsletters', label: 'News' },
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const navLinkClass = (href: string) =>
    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(href)
        ? 'text-primary bg-primary/10'
        : 'text-foreground/70 hover:text-foreground hover:bg-accent'
    }`

  const mobileNavLinkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
      isActive(href)
        ? 'text-primary bg-primary/10'
        : 'text-foreground/80 hover:text-foreground hover:bg-accent active:scale-[0.98]'
    }`

  return (
    <>
      <nav className="bg-card/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side: Logo + Desktop Nav */}
            <div className="flex items-center gap-1">
              <Link href="/" className="group mr-2 flex items-center gap-1 sm:mr-4">
                <Image
                  src="/images/Volleyball.svg"
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain transition-transform duration-500 group-hover:rotate-[360deg] sm:h-9 sm:w-9"
                />
                <Image
                  src="/images/titlelogo.svg"
                  alt="Midtown Runs"
                  width={160}
                  height={40}
                  className="hidden h-8 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80 sm:block"
                  priority
                />
              </Link>
              {user && (
                <div className="hidden md:flex md:items-center md:gap-0.5">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive('/admin')
                          ? 'bg-primary/15 text-primary'
                          : 'text-primary/80 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Right side: User Menu + Mobile Hamburger */}
            <div className="flex items-center gap-2">
              {loading ? (
                <span className="text-muted-foreground animate-pulse text-sm">Loading...</span>
              ) : user ? (
                <>
                  {/* Desktop user dropdown */}
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-normal transition-all duration-200 hover:shadow-md"
                        >
                          <span className="max-w-[160px] truncate">{user.email}</span>
                          <svg
                            className="ml-1 h-4 w-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-destructive hover:text-destructive"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mobile hamburger button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="relative z-50 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-accent md:hidden"
                    aria-label="Toggle menu"
                  >
                    <div className="flex w-5 flex-col items-center gap-[5px]">
                      <span
                        className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                          mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                        }`}
                      />
                      <span
                        className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                          mobileMenuOpen ? 'opacity-0' : ''
                        }`}
                      />
                      <span
                        className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                          mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                        }`}
                      />
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="transition-all duration-200 hover:bg-[#22c55e] hover:shadow-lg hover:shadow-primary/30"
                    >
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
              mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in menu */}
          <div
            className={`fixed top-0 right-0 z-40 flex h-full w-[280px] max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out md:hidden ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Menu header */}
            <div className="flex h-16 items-center justify-between border-b px-4">
              <span className="text-sm font-medium text-muted-foreground">Menu</span>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={mobileNavLinkClass(link.href)}>
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin" className={mobileNavLinkClass('/admin')}>
                    <span className="text-primary">Admin Panel</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Menu footer with user info & logout */}
            <div className="border-t p-4">
              <div className="mb-3 truncate text-sm text-muted-foreground">{user.email}</div>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
