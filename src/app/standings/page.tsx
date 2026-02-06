import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SeasonSelector } from '@/components/user/SeasonSelector'
import { calculateWinPercentage } from '@/lib/utils'

type Standing = {
  team_id: string
  total_sets_won: number
  total_sets_lost: number
  teams: {
    name: string
  }
}

type PlayerLeaderboard = {
  user_id: string
  display_name: string | null
  email: string
  total_sets_won: number
  total_sets_lost: number
  games_played: number
  win_percentage: number
  teams_played_on: string[] | null
}

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, status')
    .order('created_at', { ascending: false })

  // Default to active season or most recent
  let selectedSeasonId = params.season
  if (!selectedSeasonId && seasons && seasons.length > 0) {
    const activeSeason = (seasons as any).find((s: any) => s.status === 'active')
    selectedSeasonId = activeSeason ? activeSeason.id : (seasons as any)[0].id
  }

  // Get standings for selected season
  let standings: Standing[] = []
  if (selectedSeasonId) {
    const { data } = await supabase
      .from('season_teams')
      .select(
        `
        team_id,
        total_sets_won,
        total_sets_lost,
        teams (
          name
        )
      `
      )
      .eq('season_id', selectedSeasonId)

    if (data) {
      standings = data as Standing[]

      // Sort by win percentage, then by total sets won
      standings.sort((a, b) => {
        const aWinPct = calculateWinPercentage(a.total_sets_won, a.total_sets_lost)
        const bWinPct = calculateWinPercentage(b.total_sets_won, b.total_sets_lost)

        if (aWinPct !== bWinPct) {
          return bWinPct - aWinPct
        }

        return b.total_sets_won - a.total_sets_won
      })
    }
  }

  // Get player leaderboard
  const { data: playerLeaderboard } = await supabase
    .from('player_leaderboard')
    .select('*')
    .limit(20)

  const players = (playerLeaderboard || []) as PlayerLeaderboard[]

  return (
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b py-6 sm:py-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[400px] w-[800px] opacity-[0.06]">
          <Image src="/images/scoreboard.png" alt="" fill className="object-contain" />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="fade-in-up mb-6 sm:mb-8">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">Season Standings</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
            Current team rankings and statistics
          </p>
        </div>

        {seasons && seasons.length > 0 && selectedSeasonId && (
          <SeasonSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            basePath="/standings"
          />
        )}

        <Card className="border-none bg-gradient-to-br from-[#2d5f3f] to-[#1a3a28] text-white shadow-2xl">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-2xl font-bold text-[#4ade80] sm:text-3xl">
              Team Standings
            </CardTitle>
            <CardDescription className="text-gray-300">
              Rankings based on win percentage and total sets won
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {standings.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-lg bg-[#1a3a28] p-4 sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#4ade80] hover:bg-[#2d5f3f]">
                        <TableHead className="w-16 font-bold text-[#4ade80]">Rank</TableHead>
                        <TableHead className="font-bold text-[#4ade80]">Team</TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Sets Won
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Sets Lost
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Win %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((standing, index) => {
                        const winPercentage = calculateWinPercentage(
                          standing.total_sets_won,
                          standing.total_sets_lost
                        )
                        const totalGames = standing.total_sets_won + standing.total_sets_lost

                        return (
                          <TableRow
                            key={standing.team_id}
                            className="border-[#2d5f3f] transition-colors hover:bg-[#2d5f3f]"
                          >
                            <TableCell className="text-2xl font-bold text-[#4ade80]">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-lg font-bold text-white">
                              {standing.teams.name}
                            </TableCell>
                            <TableCell className="text-center text-lg text-white">
                              {standing.total_sets_won}
                            </TableCell>
                            <TableCell className="text-center text-lg text-white">
                              {standing.total_sets_lost}
                            </TableCell>
                            <TableCell className="text-center">
                              {totalGames > 0 ? (
                                <span className="text-xl font-bold text-[#4ade80]">
                                  {winPercentage.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card layout */}
                <div className="space-y-2 sm:hidden">
                  {standings.map((standing, index) => {
                    const winPercentage = calculateWinPercentage(
                      standing.total_sets_won,
                      standing.total_sets_lost
                    )
                    const totalGames = standing.total_sets_won + standing.total_sets_lost

                    return (
                      <div
                        key={standing.team_id}
                        className="flex items-center justify-between rounded-lg bg-[#1a3a28] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              index === 0
                                ? 'bg-[#4ade80] text-black'
                                : 'bg-[#2d5f3f] text-[#4ade80]'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white">{standing.teams.name}</div>
                            <div className="text-xs text-gray-400">
                              {standing.total_sets_won}W - {standing.total_sets_lost}L
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-[#4ade80]">
                          {totalGames > 0 ? `${winPercentage.toFixed(0)}%` : '-'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="py-10 text-center sm:py-12">
                <p className="text-gray-500">No standings data available yet</p>
                <p className="mt-2 text-sm text-gray-400">
                  Standings will appear once game results are recorded
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {standings.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 md:gap-6">
            <Card className="border-none bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-black sm:text-lg">Most Wins</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-lg font-bold text-black sm:text-2xl">
                  {standings[0]?.teams.name}
                </div>
                <div className="text-xs text-gray-800 sm:text-sm">
                  {standings[0]?.total_sets_won} sets won
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-gradient-to-br from-[#2d5f3f] to-[#1a3a28] shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-[#4ade80] sm:text-lg">Best Win %</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-lg font-bold text-white sm:text-2xl">
                  {standings[0]?.teams.name}
                </div>
                <div className="text-xs text-gray-300 sm:text-sm">
                  {calculateWinPercentage(
                    standings[0]?.total_sets_won || 0,
                    standings[0]?.total_sets_lost || 0
                  ).toFixed(1)}
                  % win rate
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 border-none bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-lg md:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-black sm:text-lg">Total Teams</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-lg font-bold text-black sm:text-2xl">{standings.length}</div>
                <div className="text-xs text-gray-800 sm:text-sm">competing this season</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Player Leaderboard Section */}
        <Card className="mt-8 border-none bg-gradient-to-br from-[#1a3a28] to-[#0d1f15] text-white shadow-2xl sm:mt-12">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-2xl font-bold text-[#4ade80] sm:text-3xl">
              Player Leaderboard
            </CardTitle>
            <CardDescription className="text-gray-300">
              Individual player rankings based on all-time performance
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {players.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-lg bg-[#0d1f15] p-4 md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#4ade80] hover:bg-[#1a3a28]">
                        <TableHead className="w-16 font-bold text-[#4ade80]">Rank</TableHead>
                        <TableHead className="font-bold text-[#4ade80]">Player</TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Games
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Sets Won
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Sets Lost
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#4ade80]">
                          Win %
                        </TableHead>
                        <TableHead className="font-bold text-[#4ade80]">Teams</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player, index) => (
                        <TableRow
                          key={player.user_id}
                          className="border-[#1a3a28] transition-colors hover:bg-[#1a3a28]"
                        >
                          <TableCell className="text-2xl font-bold">
                            {index === 0 ? (
                              <span className="text-yellow-400">🥇</span>
                            ) : index === 1 ? (
                              <span className="text-gray-300">🥈</span>
                            ) : index === 2 ? (
                              <span className="text-amber-600">🥉</span>
                            ) : (
                              <span className="text-[#4ade80]">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-lg font-bold text-white">
                            {player.display_name || player.email.split('@')[0]}
                          </TableCell>
                          <TableCell className="text-center text-gray-300">
                            {player.games_played}
                          </TableCell>
                          <TableCell className="text-center text-lg text-white">
                            {player.total_sets_won}
                          </TableCell>
                          <TableCell className="text-center text-lg text-white">
                            {player.total_sets_lost}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xl font-bold text-[#4ade80]">
                              {player.win_percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-gray-400">
                            {player.teams_played_on?.join(', ') || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card layout */}
                <div className="space-y-2 md:hidden">
                  {players.map((player, index) => (
                    <div
                      key={player.user_id}
                      className="flex items-center justify-between rounded-lg bg-[#0d1f15] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-lg">
                          {index === 0 ? (
                            '🥇'
                          ) : index === 1 ? (
                            '🥈'
                          ) : index === 2 ? (
                            '🥉'
                          ) : (
                            <span className="text-sm font-bold text-[#4ade80]">{index + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-white">
                            {player.display_name || player.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-400">
                            {player.games_played} games &middot; {player.total_sets_won}W -{' '}
                            {player.total_sets_lost}L
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 text-lg font-bold text-[#4ade80]">
                        {player.win_percentage.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-center sm:py-12">
                <p className="text-gray-500">No player stats available yet</p>
                <p className="mt-2 text-sm text-gray-400">
                  Player stats will appear once captains report game participation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Player Stats Cards */}
        {players.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 md:gap-6">
            <Card className="border-none bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-black sm:text-lg">Top Player</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="truncate text-lg font-bold text-black sm:text-2xl">
                  {players[0]?.display_name || players[0]?.email.split('@')[0]}
                </div>
                <div className="text-xs text-gray-800 sm:text-sm">
                  {players[0]?.win_percentage.toFixed(1)}% win rate
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-gradient-to-br from-[#2d5f3f] to-[#1a3a28] shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-[#4ade80] sm:text-lg">Most Sets Won</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {(() => {
                  const mostWins = [...players].sort(
                    (a, b) => b.total_sets_won - a.total_sets_won
                  )[0]
                  return (
                    <>
                      <div className="truncate text-lg font-bold text-white sm:text-2xl">
                        {mostWins?.display_name || mostWins?.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-300 sm:text-sm">
                        {mostWins?.total_sets_won} total sets won
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>

            <Card className="col-span-2 border-none bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-lg md:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm text-black sm:text-lg">Active Players</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="text-lg font-bold text-black sm:text-2xl">{players.length}</div>
                <div className="text-xs text-gray-800 sm:text-sm">players with recorded stats</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
