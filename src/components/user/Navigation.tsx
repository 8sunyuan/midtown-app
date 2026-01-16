'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Show navbar even while loading, just hide user-specific content
  // if (loading) {
  //   return null
  // }

  const navLinkClass = "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-all duration-200"
  const adminLinkClass = "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary hover:text-primary hover:bg-primary/10 transition-all duration-200"

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1 group mr-4">
              <Image
                src="/images/Volleyball.svg"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain group-hover:rotate-[360deg] transition-transform duration-500"
              />
              <Image
                src="/images/titlelogo.svg"
                alt="Midtown Runs"
                width={160}
                height={40}
                className="h-8 w-auto object-contain group-hover:opacity-80 transition-opacity duration-200"
                priority
              />
            </Link>
            {user && (
              <div className="hidden sm:flex sm:space-x-1">
                <Link href="/dashboard" className={navLinkClass}>
                  Dashboard
                </Link>
                <Link href="/teams" className={navLinkClass}>
                  Teams
                </Link>
                <Link href="/schedule" className={navLinkClass}>
                  Schedule
                </Link>
                <Link href="/standings" className={navLinkClass}>
                  Standings
                </Link>
                <Link href="/newsletters" className={navLinkClass}>
                  Newsletters
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={adminLinkClass}>
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {loading ? (
              <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-normal hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                    <span className="hidden sm:inline">{user.email}</span>
                    <span className="sm:hidden">Account</span>
                    <svg className="w-4 h-4 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:text-destructive">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="hover:-translate-y-1 hover:text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 hover:bg-[#22c55e] transition-all duration-200">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

