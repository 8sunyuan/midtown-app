'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

type Season = {
  id: string
  name: string
}

type GameDay = {
  id: string
  game_date: string
}

type Team = {
  id: string
  name: string
}

type GameResult = {
  team_id: string
  sets_won: number
  sets_lost: number
}

export default function ResultsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [selectedGameDay, setSelectedGameDay] = useState<string>('')
  const [results, setResults] = useState<Map<string, GameResult>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      loadGameDays(selectedSeason)
      loadTeams(selectedSeason)
    }
  }, [selectedSeason])

  useEffect(() => {
    if (selectedGameDay) {
      loadExistingResults(selectedGameDay)
    }
  }, [selectedGameDay, teams])

  const loadSeasons = async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSeasons(data)
      if (data.length > 0 && !selectedSeason) {
        setSelectedSeason(data[0].id)
      }
    }
  }

  const loadGameDays = async (seasonId: string) => {
    const { data, error } = await supabase
      .from('game_days')
      .select('id, game_date')
      .eq('season_id', seasonId)
      .order('game_date', { ascending: false })

    if (!error && data) {
      setGameDays(data)
    }
  }

  const loadTeams = async (seasonId: string) => {
    const { data, error } = await supabase
      .from('season_teams')
      .select(
        `
        team_id,
        teams (
          id,
          name
        )
      `
      )
      .eq('season_id', seasonId)

    if (!error && data) {
      const teamsList = data.map((st: any) => ({
        id: st.teams.id,
        name: st.teams.name,
      }))
      setTeams(teamsList)
    }
  }

  const loadExistingResults = async (gameDayId: string) => {
    const { data, error } = await supabase
      .from('game_results')
      .select('team_id, sets_won, sets_lost')
      .eq('game_day_id', gameDayId)

    if (!error && data) {
      const resultsMap = new Map<string, GameResult>()
      data.forEach((result: any) => {
        resultsMap.set(result.team_id, {
          team_id: result.team_id,
          sets_won: result.sets_won,
          sets_lost: result.sets_lost,
        })
      })
      setResults(resultsMap)
    } else {
      // Initialize empty results for all teams
      const resultsMap = new Map<string, GameResult>()
      teams.forEach((team) => {
        resultsMap.set(team.id, {
          team_id: team.id,
          sets_won: 0,
          sets_lost: 0,
        })
      })
      setResults(resultsMap)
    }
  }

  const updateResult = (teamId: string, field: 'sets_won' | 'sets_lost', value: number) => {
    const newResults = new Map(results)
    const current = newResults.get(teamId) || { team_id: teamId, sets_won: 0, sets_lost: 0 }
    newResults.set(teamId, {
      ...current,
      [field]: Math.max(0, value), // Prevent negative values
    })
    setResults(newResults)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameDay) {
      setError('Please select a game day')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Delete existing results for this game day
      await supabase.from('game_results').delete().eq('game_day_id', selectedGameDay)

      // Insert new results
      const resultsToInsert = Array.from(results.values()).map((result) => ({
        game_day_id: selectedGameDay,
        team_id: result.team_id,
        sets_won: result.sets_won,
        sets_lost: result.sets_lost,
      }))

      const { error: insertError } = await supabase.from('game_results').insert(resultsToInsert)

      if (insertError) {
        setError('Failed to save results')
        setLoading(false)
        return
      }

      setSuccess('Results saved successfully! Standings have been updated.')
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  return (
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b py-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[700px] w-[1000px] opacity-[0.03]">
          <img
            src="/images/volleyball-players-dark.png"
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold">Enter Game Results</h1>
            <p className="text-muted-foreground mt-2">Record sets won and lost for each team</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">{success}</div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="season">Select Season</Label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameDay">Select Game Day</Label>
            <Select
              value={selectedGameDay}
              onValueChange={setSelectedGameDay}
              disabled={!selectedSeason}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game day" />
              </SelectTrigger>
              <SelectContent>
                {gameDays.map((gameDay) => (
                  <SelectItem key={gameDay.id} value={gameDay.id}>
                    {new Date(gameDay.game_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedGameDay && teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Game Results</CardTitle>
              <CardDescription>Enter the number of sets won and lost for each team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Sets Won</TableHead>
                      <TableHead className="text-center">Sets Lost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => {
                      const result = results.get(team.id) || { sets_won: 0, sets_lost: 0 }
                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={result.sets_won}
                              onChange={(e) =>
                                updateResult(team.id, 'sets_won', parseInt(e.target.value) || 0)
                              }
                              className="mx-auto w-24"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={result.sets_lost}
                              onChange={(e) =>
                                updateResult(team.id, 'sets_lost', parseInt(e.target.value) || 0)
                              }
                              className="mx-auto w-24"
                              disabled={loading}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Results'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {selectedSeason && teams.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                No teams found for this season. Add teams to the season first.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
