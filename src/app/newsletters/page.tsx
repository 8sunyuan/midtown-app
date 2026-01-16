import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'

type Newsletter = {
  id: string
  title: string
  content: string
  published_at: string | null
  users: {
    email: string
    display_name: string | null
  }
}

export default async function NewslettersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get published newsletters only
  const { data: newsletters } = await supabase
    .from('newsletters')
    .select(
      `
      id,
      title,
      content,
      published_at,
      users (
        email,
        display_name
      )
    `
    )
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  return (
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b py-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[700px] w-[1000px] opacity-[0.03]">
          <img
            src="/images/volleyball-players-light.png"
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold">League Newsletters</h1>
          <p className="text-muted-foreground mt-2">Latest announcements and updates</p>
        </div>

        {newsletters && newsletters.length > 0 ? (
          <div className="space-y-6">
            {newsletters.map((newsletter: Newsletter) => (
              <Card key={newsletter.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="mb-2 text-2xl">{newsletter.title}</CardTitle>
                      <CardDescription>
                        Published{' '}
                        {newsletter.published_at
                          ? formatDateTime(newsletter.published_at)
                          : 'Unknown'}
                        {newsletter.users.display_name && <> by {newsletter.users.display_name}</>}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{newsletter.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No newsletters published yet</p>
              <p className="mt-2 text-sm text-gray-400">
                Check back later for league announcements and updates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
