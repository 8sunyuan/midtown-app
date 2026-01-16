import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  try {
    const supabase = await createClient()

    // Fetch counts in parallel
    const [usersResult, teamsResult, seasonsResult] = await Promise.all([
      supabase
        .from('team_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('seasons').select('id', { count: 'exact', head: true }),
    ])

    return {
      activePlayers: usersResult.count ?? null,
      teams: teamsResult.count ?? null,
      leagues: seasonsResult.count ?? null,
    }
  } catch {
    // Return null if fetch fails (e.g., user not authenticated)
    return { activePlayers: null, teams: null, leagues: null }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section with Volleyball Players */}
      <div className="relative flex min-h-[600px] items-center overflow-hidden bg-[#0d1f15] text-white">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/volleyball-players-dark.png"
            alt="Volleyball players"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f15]/80 via-transparent to-[#0d1f15]" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-[#4ade80]/5 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-block rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-4 py-2">
            <span className="text-sm font-medium text-[#4ade80]">🏐 Season Registration Open</span>
          </div>
          <div className="mb-6 flex flex-col items-center justify-center">
            <div className="mb-4 flex items-center">
              <Image
                src="/images/titlelogo.svg"
                alt="Midtown Runs"
                width={500}
                height={70}
                className="h-14 w-auto brightness-0 invert md:h-20"
                priority
              />
              <Image
                src="/images/Volleyball.svg"
                alt=""
                width={80}
                height={80}
                className="-ml-5 h-16 w-auto md:h-20"
              />
            </div>
            <h1 className="text-center text-4xl font-bold md:text-6xl">
              <span className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
                Volleyball League
              </span>
            </h1>
          </div>
          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-300 md:text-2xl">
            Join the action! Manage your volleyball league with ease. Track teams, schedules,
            standings, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 w-40 bg-[#4ade80] text-lg font-bold text-black shadow-lg shadow-[#4ade80]/25 transition-all duration-200 hover:-translate-y-1 hover:bg-[#22c55e] hover:shadow-[#4ade80]/40"
              >
                Get Started
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-40 border border-[#4ade80]/50 text-lg font-bold text-[#4ade80] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-[#4ade80] hover:text-black hover:shadow-lg hover:shadow-[#4ade80]/25"
              >
                Login
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4ade80]">
                {stats.activePlayers !== null ? stats.activePlayers : '—'}
              </div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4ade80]">
                {stats.teams !== null ? stats.teams : '—'}
              </div>
              <div className="text-sm text-gray-400">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4ade80]">
                {stats.leagues !== null ? stats.leagues : '—'}
              </div>
              <div className="text-sm text-gray-400">Leagues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#f8f6f1] to-white py-24">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Powerful tools to manage your volleyball league from start to finish
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] transition-transform group-hover:scale-110">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-foreground mb-3 text-2xl font-bold">Manage Teams</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create and manage teams with up to 10 players each. Invite players and track your
                roster with ease.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] transition-transform group-hover:scale-110">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-foreground mb-3 text-2xl font-bold">Track Standings</h3>
              <p className="text-muted-foreground leading-relaxed">
                View real-time standings and game results. See your team&apos;s win percentage and
                ranking.
              </p>
            </div>

            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] transition-transform group-hover:scale-110">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-foreground mb-3 text-2xl font-bold">View Schedules</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access game schedules with detailed information, court assignments, and game times.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard Preview Section */}
      <div className="relative overflow-hidden bg-[#0d1f15] py-24 text-white">
        {/* Background scoreboard image */}
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/scoreboard.png" alt="Scoreboard" fill className="object-cover" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f15] via-[#0d1f15]/90 to-[#0d1f15]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                Follow the
                <span className="text-[#4ade80]"> Action</span> Live
              </h2>
              <p className="mb-8 text-xl leading-relaxed text-gray-300">
                Track game results, standings, and team statistics in real-time. Never miss a moment
                of the competition.
              </p>
              <ul className="mb-8 space-y-4">
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4ade80]">
                    <svg
                      className="h-4 w-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-lg">Live standings updates</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4ade80]">
                    <svg
                      className="h-4 w-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-lg">Win/loss tracking per team</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4ade80]">
                    <svg
                      className="h-4 w-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-lg">Season history and stats</span>
                </li>
              </ul>
              <Link href="/standings">
                <Button
                  size="lg"
                  className="bg-[#4ade80] px-10 py-6 text-lg font-bold text-black hover:bg-[#22c55e]"
                >
                  View Standings
                  <svg
                    className="ml-2 h-5 w-5"
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
            </div>

            {/* Scoreboard preview card */}
            <div className="relative">
              <div className="rounded-2xl border border-[#4ade80]/20 bg-gradient-to-br from-[#1a3a28] to-[#0d1f15] p-8 shadow-2xl">
                <div className="mb-6 text-center">
                  <div className="mb-2 text-sm font-bold tracking-wider text-[#4ade80] uppercase">
                    Current Standings
                  </div>
                  <div className="text-2xl font-bold">Spring 2026</div>
                </div>
                <div className="space-y-3">
                  {[
                    { rank: 1, team: 'Spike Force', wins: 12, losses: 2 },
                    { rank: 2, team: 'Net Ninjas', wins: 10, losses: 4 },
                    { rank: 3, team: 'Block Party', wins: 8, losses: 6 },
                  ].map((team) => (
                    <div
                      key={team.rank}
                      className="flex items-center justify-between rounded-lg bg-[#0d1f15]/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                            team.rank === 1 ? 'bg-[#4ade80] text-black' : 'bg-[#2d5f3f] text-white'
                          }`}
                        >
                          {team.rank}
                        </div>
                        <span className="font-semibold">{team.team}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#4ade80]">{team.wins}W</span>
                        <span className="mx-1 text-gray-500">-</span>
                        <span className="text-gray-400">{team.losses}L</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-[#4ade80]/10 blur-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f8f6f1] py-24">
        <div className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[#4ade80]/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-block">
            <span className="text-6xl">🏐</span>
          </div>
          <h2 className="text-foreground mb-6 text-4xl font-bold md:text-5xl">Ready to Join?</h2>
          <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl">
            Sign up today and be part of the Midtown Runs volleyball community. Your next great game
            is waiting!
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="shadow-primary/25 hover:shadow-primary/40 px-12 py-7 text-lg font-bold shadow-lg transition-all"
            >
              Create Your Account
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1f15] py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-6 md:mb-0">
              <span className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-2xl font-bold text-transparent">
                Midtown Runs
              </span>
              <p className="mt-2 text-gray-400">Your local volleyball league</p>
            </div>
            <div className="flex gap-8 text-gray-400">
              <Link href="/schedule" className="transition-colors hover:text-[#4ade80]">
                Schedule
              </Link>
              <Link href="/standings" className="transition-colors hover:text-[#4ade80]">
                Standings
              </Link>
              <Link href="/teams" className="transition-colors hover:text-[#4ade80]">
                Teams
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            © 2026 Midtown Runs Volleyball League. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
