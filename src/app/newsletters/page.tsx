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
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get published newsletters only
  const { data: newsletters } = await supabase
    .from('newsletters')
    .select(`
      id,
      title,
      content,
      published_at,
      users (
        email,
        display_name
      )
    `)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[700px] opacity-[0.03] relative">
          <img
            src="/images/volleyball-players-light.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">League Newsletters</h1>
          <p className="text-muted-foreground mt-2">Latest announcements and updates</p>
        </div>

        {newsletters && newsletters.length > 0 ? (
          <div className="space-y-6">
            {newsletters.map((newsletter: Newsletter) => (
              <Card key={newsletter.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {newsletter.title}
                      </CardTitle>
                      <CardDescription>
                        Published {newsletter.published_at ? formatDateTime(newsletter.published_at) : 'Unknown'}
                        {newsletter.users.display_name && (
                          <> by {newsletter.users.display_name}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {newsletter.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No newsletters published yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Check back later for league announcements and updates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

