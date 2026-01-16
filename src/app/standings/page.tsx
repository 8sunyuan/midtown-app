import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user } } = await supabase.auth.getUser()

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
    const activeSeason = seasons.find((s: any) => s.status === 'active')
    selectedSeasonId = activeSeason ? activeSeason.id : seasons[0].id
  }

  // Get standings for selected season
  let standings: Standing[] = []
  if (selectedSeasonId) {
    const { data } = await supabase
      .from('season_teams')
      .select(`
        team_id,
        total_sets_won,
        total_sets_lost,
        teams (
          name
        )
      `)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] opacity-[0.06] relative">
          <Image
            src="/images/scoreboard.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Season Standings</h1>
          <p className="text-muted-foreground mt-2">Current team rankings and statistics</p>
        </div>

        {seasons && seasons.length > 0 && selectedSeasonId && (
          <SeasonSelector 
            seasons={seasons} 
            selectedSeasonId={selectedSeasonId} 
            basePath="/standings" 
          />
        )}

        <Card className="bg-gradient-to-br from-[#2d5f3f] to-[#1a3a28] text-white border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#4ade80]">Team Standings</CardTitle>
            <CardDescription className="text-gray-300">
              Rankings based on win percentage and total sets won
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standings.length > 0 ? (
              <div className="overflow-x-auto bg-[#1a3a28] rounded-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#4ade80] hover:bg-[#2d5f3f]">
                      <TableHead className="w-16 text-[#4ade80] font-bold">Rank</TableHead>
                      <TableHead className="text-[#4ade80] font-bold">Team</TableHead>
                      <TableHead className="text-center text-[#4ade80] font-bold">Sets Won</TableHead>
                      <TableHead className="text-center text-[#4ade80] font-bold">Sets Lost</TableHead>
                      <TableHead className="text-center text-[#4ade80] font-bold">Win %</TableHead>
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
                        <TableRow key={standing.team_id} className="border-[#2d5f3f] hover:bg-[#2d5f3f] transition-colors">
                          <TableCell className="font-bold text-2xl text-[#4ade80]">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-lg text-white">
                            {standing.teams.name}
                          </TableCell>
                          <TableCell className="text-center text-white text-lg">
                            {standing.total_sets_won}
                          </TableCell>
                          <TableCell className="text-center text-white text-lg">
                            {standing.total_sets_lost}
                          </TableCell>
                          <TableCell className="text-center">
                            {totalGames > 0 ? (
                              <span className="font-bold text-xl text-[#4ade80]">
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
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No standings data available yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Standings will appear once game results are recorded
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {standings.length > 0 && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-black">🏆 Most Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {standings[0]?.teams.name}
                </div>
                <div className="text-sm text-gray-800">
                  {standings[0]?.total_sets_won} sets won
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#2d5f3f] to-[#1a3a28] border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-[#4ade80]">📈 Best Win %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {standings[0]?.teams.name}
                </div>
                <div className="text-sm text-gray-300">
                  {calculateWinPercentage(
                    standings[0]?.total_sets_won || 0,
                    standings[0]?.total_sets_lost || 0
                  ).toFixed(1)}% win rate
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-black">👥 Total Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {standings.length}
                </div>
                <div className="text-sm text-gray-800">
                  competing this season
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

