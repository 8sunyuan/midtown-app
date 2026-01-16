'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

type AdminUser = {
  user_id: string
  granted_at: string
  users: {
    email: string
    display_name: string | null
  }
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        user_id,
        granted_at,
        users (
          email,
          display_name
        )
      `)
      .order('granted_at', { ascending: false })

    if (!error && data) {
      setAdmins(data as AdminUser[])
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        setError('User with this email not found')
        setLoading(false)
        return
      }

      // Add to admin_users
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({ user_id: userData.id })

      if (adminError) {
        if (adminError.code === '23505') {
          setError('User is already an admin')
        } else {
          setError('Failed to add admin')
        }
        setLoading(false)
        return
      }

      setSuccess('Admin added successfully')
      setEmail('')
      loadAdmins()
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) {
      return
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId)

    if (error) {
      setError('Failed to remove admin')
    } else {
      setSuccess('Admin removed successfully')
      loadAdmins()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[700px] opacity-[0.03] relative">
          <img
            src="/images/volleyball-players-dark.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Admins</h1>
            <p className="text-muted-foreground mt-2">Add or remove administrator access</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Admin</CardTitle>
              <CardDescription>
                Grant administrator access to a registered user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    The user must be registered already
                  </p>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                    {success}
                  </div>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Admin'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Admins</CardTitle>
              <CardDescription>
                Users with administrator privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {admins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{admin.users.email}</div>
                            {admin.users.display_name && (
                              <div className="text-sm text-gray-500">
                                {admin.users.display_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.user_id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No admins found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

