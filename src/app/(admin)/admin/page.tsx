import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminData) {
    redirect('/dashboard')
  }

  // Get some stats
  const { count: teamsCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })

  const { count: seasonsCount } = await supabase
    .from('seasons')
    .select('*', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your volleyball league</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{teamsCount || 0}</CardTitle>
              <CardDescription>Total Teams</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{seasonsCount || 0}</CardTitle>
              <CardDescription>Total Seasons</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{usersCount || 0}</CardTitle>
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/seasons" className="block group">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Manage Seasons</CardTitle>
                <CardDescription>
                  Create and manage league seasons
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/game-days" className="block group">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Game Day Schedules</CardTitle>
                <CardDescription>
                  Upload schedules and game information
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/results" className="block group">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Enter Results</CardTitle>
                <CardDescription>
                  Record game results and update standings
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/newsletters" className="block group">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Newsletters</CardTitle>
                <CardDescription>
                  Post announcements and newsletters
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/admins" className="block group">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Manage Admins</CardTitle>
                <CardDescription>
                  Add or remove administrator access
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard" className="block">
            <Card className="cursor-pointer h-full">
              <CardHeader>
                <CardTitle>Back to Dashboard</CardTitle>
                <CardDescription>
                  Return to user dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

