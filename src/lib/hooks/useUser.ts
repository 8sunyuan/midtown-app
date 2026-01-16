'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    let mounted = true

    // Get user immediately
    const initUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (mounted && user) {
          setUser(user)
        }
      } catch (err) {
        console.error('Error getting user:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initUser()

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Check admin status separately - doesn't block loading
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    let mounted = true
    const supabase = supabaseRef.current

    const checkAdmin = async () => {
      try {
        const { data } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (mounted) {
          setIsAdmin(!!data)
        }
      } catch {
        if (mounted) setIsAdmin(false)
      }
    }

    // Check with timeout
    const timeout = setTimeout(() => {
      if (mounted) setIsAdmin(false)
    }, 3000)

    checkAdmin().finally(() => clearTimeout(timeout))

    return () => {
      mounted = false
    }
  }, [user])

  return { user, isAdmin, loading }
}
