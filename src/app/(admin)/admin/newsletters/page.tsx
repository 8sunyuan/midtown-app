'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

type Newsletter = {
  id: string
  title: string
  content: string
  created_at: string
  published_at: string | null
  users: {
    email: string
    display_name: string | null
  }
}

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadNewsletters()
  }, [])

  const loadNewsletters = async () => {
    const { data, error } = await supabase
      .from('newsletters')
      .select(`
        id,
        title,
        content,
        created_at,
        published_at,
        users (
          email,
          display_name
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNewsletters(data as Newsletter[])
    }
  }

  const openCreateDialog = () => {
    setCurrentNewsletter(null)
    setTitle('')
    setContent('')
    setError(null)
    setSuccess(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (newsletter: Newsletter) => {
    setCurrentNewsletter(newsletter)
    setTitle(newsletter.title)
    setContent(newsletter.content)
    setError(null)
    setSuccess(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      if (currentNewsletter) {
        // Update existing newsletter
        const { error: updateError } = await supabase
          .from('newsletters')
          .update({
            title,
            content,
          })
          .eq('id', currentNewsletter.id)

        if (updateError) {
          setError('Failed to update newsletter')
          setLoading(false)
          return
        }

        setSuccess('Newsletter updated successfully')
      } else {
        // Create new newsletter
        const { error: insertError } = await supabase
          .from('newsletters')
          .insert({
            title,
            content,
            created_by: user.id,
          })

        if (insertError) {
          setError('Failed to create newsletter')
          setLoading(false)
          return
        }

        setSuccess('Newsletter created successfully')
      }

      setIsDialogOpen(false)
      loadNewsletters()
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handlePublish = async (newsletterId: string, isPublished: boolean) => {
    const { error } = await supabase
      .from('newsletters')
      .update({
        published_at: isPublished ? null : new Date().toISOString(),
      })
      .eq('id', newsletterId)

    if (error) {
      setError('Failed to update publish status')
    } else {
      setSuccess(isPublished ? 'Newsletter unpublished' : 'Newsletter published')
      loadNewsletters()
    }
  }

  const handleDelete = async (newsletterId: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) {
      return
    }

    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', newsletterId)

    if (error) {
      setError('Failed to delete newsletter')
    } else {
      setSuccess('Newsletter deleted')
      loadNewsletters()
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
            <h1 className="text-3xl font-bold text-foreground">Newsletters</h1>
            <p className="text-muted-foreground mt-2">Create and manage league announcements</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateDialog}>Create Newsletter</Button>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Newsletters</CardTitle>
            <CardDescription>
              Manage your league newsletters and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {newsletters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletters.map((newsletter) => (
                    <TableRow key={newsletter.id}>
                      <TableCell className="font-medium">
                        {newsletter.title}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(newsletter.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {newsletter.users.display_name || newsletter.users.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {newsletter.published_at ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(newsletter)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(newsletter.id, !!newsletter.published_at)}
                          >
                            {newsletter.published_at ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(newsletter.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No newsletters created yet
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {currentNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}
              </DialogTitle>
              <DialogDescription>
                {currentNewsletter ? 'Update your newsletter' : 'Create a new announcement for the league'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Important Update: Ice Cream Social"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (currentNewsletter ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

