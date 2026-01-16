import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SeasonSelector } from '@/components/user/SeasonSelector'
import Image from 'next/image'

type GameDay = {
  id: string
  game_date: string
  description: string | null
  image_url: string | null
  seasons: {
    name: string
  }
}

export default async function SchedulePage({
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
    .select('id, name')
    .order('created_at', { ascending: false })

  const selectedSeasonId = params.season || (seasons && seasons.length > 0 ? seasons[0].id : '')

  // Get game days for selected season
  let gameDays: GameDay[] = []
  if (selectedSeasonId) {
    const { data } = await supabase
      .from('game_days')
      .select(`
        id,
        game_date,
        description,
        image_url,
        seasons (
          name
        )
      `)
      .eq('season_id', selectedSeasonId)
      .order('game_date', { ascending: true })

    if (data) {
      gameDays = data as GameDay[]
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingGames = gameDays.filter(g => g.game_date >= today)
  const pastGames = gameDays.filter(g => g.game_date < today).reverse()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[700px] opacity-[0.03] relative">
          <Image
            src="/images/volleyball-players-light.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Game Schedule</h1>
          <p className="text-muted-foreground mt-2">View upcoming and past game days</p>
        </div>

        {seasons && seasons.length > 0 && (
          <SeasonSelector 
            seasons={seasons} 
            selectedSeasonId={selectedSeasonId} 
            basePath="/schedule" 
          />
        )}

        {upcomingGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Games</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {upcomingGames.map((game) => (
                <Card key={game.id}>
                  <CardHeader>
                    <CardTitle>
                      {new Date(game.game_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription>{game.seasons.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {game.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Schedule Details</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {game.description}
                        </p>
                      </div>
                    )}
                    {game.image_url && (
                      <div>
                        <h3 className="font-semibold mb-2">Schedule Image</h3>
                        <div className="relative w-full h-96 bg-gray-100 rounded">
                          <Image
                            src={game.image_url}
                            alt="Game schedule"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      </div>
                    )}
                    {!game.description && !game.image_url && (
                      <p className="text-gray-500 italic">
                        Schedule details coming soon
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastGames.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Games</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {pastGames.map((game) => (
                <Card key={game.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle>
                      {new Date(game.game_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription>{game.seasons.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {game.description && (
                      <div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {game.description}
                        </p>
                      </div>
                    )}
                    {game.image_url && (
                      <div className="mt-4">
                        <div className="relative w-full h-64 bg-gray-100 rounded">
                          <Image
                            src={game.image_url}
                            alt="Game schedule"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {gameDays.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No games scheduled yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

