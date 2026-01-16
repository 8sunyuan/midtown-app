'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Note: Middleware handles redirecting logged-in users to dashboard

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Force a hard navigation to ensure cookies are set
      window.location.href = '/dashboard'
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d1f15] via-[#1a3a28] to-[#0d1f15] px-4 py-12">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
      <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-[#4ade80]/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-3xl font-bold text-transparent">
              Midtown Runs
            </span>
          </Link>
          <p className="mt-2 text-gray-400">Volleyball League</p>
        </div>

        <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join the Midtown Runs community</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="h-11"
                />
                <p className="text-muted-foreground text-xs">Must be at least 6 characters long</p>
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <div className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-gray-500">
          © 2026 Midtown Runs Volleyball League
        </p>
      </div>
    </div>
  )
}
