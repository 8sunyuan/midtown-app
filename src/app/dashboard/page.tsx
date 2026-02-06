import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's teams
  const { data: teams } = await supabase
    .from('team_members')
    .select(
      `
      teams (
        id,
        name,
        captain_id
      )
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  // Get upcoming game days
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingGames } = await supabase
    .from('game_days')
    .select(
      `
      id,
      game_date,
      description,
      seasons (
        name
      )
    `
    )
    .gte('game_date', today)
    .order('game_date', { ascending: true })
    .limit(5)

  // Check if user is admin
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  const isAdmin = !!adminData

  // Get user's display name
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player'

  return (
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b">
      {/* Decorative background - centered and larger */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[800px] w-[1200px] opacity-[0.04]">
          <Image
            src="/images/volleyball-players-light.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome header */}
        <div className="fade-in-up mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl md:text-4xl">
                Welcome back, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
                Here&apos;s what&apos;s happening with your league
              </p>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="fade-in-up-delay-1 mb-6 sm:mb-8">
            <Card className="from-primary/5 to-primary/10 border-primary/20 bg-gradient-to-r">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <svg
                    className="text-primary h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Admin Access
                </CardTitle>
                <CardDescription>You have administrator privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button size="sm" className="sm:size-default">
                    Go to Admin Dashboard
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="text-lg sm:text-xl">🏐</span>
                My Teams
              </CardTitle>
              <CardDescription>Teams you&apos;re a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <ul className="space-y-2">
                  {teams.map((team: any) => (
                    <li
                      key={team.teams.id}
                      className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
                    >
                      <span className="text-sm font-medium sm:text-base">{team.teams.name}</span>
                      {team.teams.captain_id === user.id && (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 sm:py-1">
                          Captain
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center sm:py-8">
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                    You&apos;re not on any teams yet
                  </p>
                  <Link href="/teams">
                    <Button size="sm">Create or Join a Team</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="text-lg sm:text-xl">📆</span>
                Upcoming Games
              </CardTitle>
              <CardDescription>Next scheduled game days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingGames && upcomingGames.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingGames.map((game: any) => (
                    <li
                      key={game.id}
                      className="bg-muted/50 hover:bg-muted rounded-lg p-3 transition-colors"
                    >
                      <div className="text-sm font-medium sm:text-base">{game.seasons?.name}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        {new Date(game.game_date).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center sm:py-8">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No upcoming games scheduled
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-foreground text-base font-semibold sm:text-lg">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
          <Link href="/teams" className="group block">
            <Card className="hover:border-primary/40 h-full cursor-pointer hover:-translate-y-2">
              <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5f3f] to-[#4ade80] shadow-lg transition-transform group-hover:scale-110 sm:mb-4 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <span className="text-lg sm:text-2xl">👥</span>
                </div>
                <CardTitle className="group-hover:text-primary text-base transition-colors sm:text-xl">
                  Teams
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Manage your teams and rosters
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/schedule" className="group block">
            <Card className="hover:border-primary/40 h-full cursor-pointer hover:-translate-y-2">
              <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5f3f] to-[#4ade80] shadow-lg transition-transform group-hover:scale-110 sm:mb-4 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <span className="text-lg sm:text-2xl">📅</span>
                </div>
                <CardTitle className="group-hover:text-primary text-base transition-colors sm:text-xl">
                  Schedule
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  View game schedules and details
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/standings" className="group col-span-2 block md:col-span-1">
            <Card className="hover:border-primary/40 h-full cursor-pointer hover:-translate-y-2">
              <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d5f3f] to-[#4ade80] shadow-lg transition-transform group-hover:scale-110 sm:mb-4 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <span className="text-lg sm:text-2xl">🏆</span>
                </div>
                <CardTitle className="group-hover:text-primary text-base transition-colors sm:text-xl">
                  Standings
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Check current season standings
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
