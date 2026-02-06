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
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b py-6 sm:py-8">
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
        <div className="fade-in-up mb-6 sm:mb-8">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">League Newsletters</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
            Latest announcements and updates
          </p>
        </div>

        {newsletters && newsletters.length > 0 ? (
          <div className="stagger-children space-y-4 sm:space-y-6">
            {newsletters.map((newsletter: Newsletter) => (
              <Card key={newsletter.id}>
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="mb-1 text-lg sm:mb-2 sm:text-2xl">
                        {newsletter.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Published{' '}
                        {newsletter.published_at
                          ? formatDateTime(newsletter.published_at)
                          : 'Unknown'}
                        {newsletter.users.display_name && <> by {newsletter.users.display_name}</>}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap sm:text-base">
                      {newsletter.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center sm:py-12">
              <p className="text-muted-foreground">No newsletters published yet</p>
              <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
                Check back later for league announcements and updates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
