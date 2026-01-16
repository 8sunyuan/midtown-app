'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type Team = {
  id: string
  name: string
  captain_id: string
}

type GameDay = {
  id: string
  game_date: string
  season_id: string
  seasons: {
    name: string
  }
}

type TeamMember = {
  user_id: string
  users: {
    id: string
    display_name: string | null
    email: string
  }
}

type ExistingResult = {
  id: string
  sets_won: number
  sets_lost: number
}

type ExistingPlayer = {
  user_id: string
}

export default function ReportScoresPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [selectedGameDay, setSelectedGameDay] = useState<string>('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [setsWon, setSetsWon] = useState<string>('')
  const [setsLost, setSetsLost] = useState<string>('')
  const [existingResult, setExistingResult] = useState<ExistingResult | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load user's teams where they are captain
  useEffect(() => {
    async function loadMyTeams() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, captain_id')
        .eq('captain_id', user.id)

      setMyTeams(teams || [])
      setLoading(false)
    }

    loadMyTeams()
  }, [supabase, router])

  // Load game days when team is selected
  useEffect(() => {
    async function loadGameDays() {
      if (!selectedTeam) {
        setGameDays([])
        return
      }

      // Get seasons this team is in
      const { data: seasonTeams } = await supabase
        .from('season_teams')
        .select('season_id')
        .eq('team_id', selectedTeam)

      if (!seasonTeams || seasonTeams.length === 0) {
        setGameDays([])
        return
      }

      const seasonIds = seasonTeams.map((st) => st.season_id)

      // Get game days for those seasons (only past or today)
      const today = new Date().toISOString().split('T')[0]

      const { data: days } = await supabase
        .from('game_days')
        .select(
          `
          id,
          game_date,
          season_id,
          seasons (
            name
          )
        `
        )
        .in('season_id', seasonIds)
        .lte('game_date', today) // Only show game days that have passed or are today
        .order('game_date', { ascending: false })

      setGameDays((days || []) as GameDay[])
    }

    loadGameDays()
  }, [selectedTeam, supabase])

  // Load team members and existing data when game day is selected
  useEffect(() => {
    async function loadData() {
      if (!selectedTeam || !selectedGameDay) {
        setTeamMembers([])
        setExistingResult(null)
        setSelectedPlayers(new Set())
        return
      }

      // Load team members
      const { data: members } = await supabase
        .from('team_members')
        .select(
          `
          user_id,
          users (
            id,
            display_name,
            email
          )
        `
        )
        .eq('team_id', selectedTeam)
        .eq('status', 'accepted')

      setTeamMembers((members || []) as TeamMember[])

      // Also add captain to the list
      const team = myTeams.find((t) => t.id === selectedTeam)
      if (team) {
        const { data: captain } = await supabase
          .from('users')
          .select('id, display_name, email')
          .eq('id', team.captain_id)
          .single()

        if (captain) {
          const captainMember: TeamMember = {
            user_id: captain.id,
            users: captain,
          }
          // Add captain if not already in list
          const hasCaptain = members?.some((m) => m.user_id === captain.id)
          if (!hasCaptain) {
            setTeamMembers((prev) => [captainMember, ...prev])
          }
        }
      }

      // Check for existing result
      const { data: result } = await supabase
        .from('game_results')
        .select('id, sets_won, sets_lost')
        .eq('game_day_id', selectedGameDay)
        .eq('team_id', selectedTeam)
        .single()

      if (result) {
        setExistingResult(result)
        setSetsWon(result.sets_won.toString())
        setSetsLost(result.sets_lost.toString())
      } else {
        setExistingResult(null)
        setSetsWon('')
        setSetsLost('')
      }

      // Check for existing players
      const { data: existingPlayers } = await supabase
        .from('game_day_players')
        .select('user_id')
        .eq('game_day_id', selectedGameDay)
        .eq('team_id', selectedTeam)

      if (existingPlayers && existingPlayers.length > 0) {
        setSelectedPlayers(new Set(existingPlayers.map((p: ExistingPlayer) => p.user_id)))
      } else {
        setSelectedPlayers(new Set())
      }
    }

    loadData()
  }, [selectedTeam, selectedGameDay, supabase, myTeams])

  const togglePlayer = (userId: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam || !selectedGameDay) return

    setSaving(true)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert game result
      const resultData = {
        game_day_id: selectedGameDay,
        team_id: selectedTeam,
        sets_won: parseInt(setsWon) || 0,
        sets_lost: parseInt(setsLost) || 0,
        reported_by: user.id,
      }

      if (existingResult) {
        const { error: updateError } = await supabase
          .from('game_results')
          .update(resultData)
          .eq('id', existingResult.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('game_results').insert(resultData)

        if (insertError) throw insertError
      }

      // Update game day players
      // First, remove existing players for this game day/team
      await supabase
        .from('game_day_players')
        .delete()
        .eq('game_day_id', selectedGameDay)
        .eq('team_id', selectedTeam)

      // Then insert new player selections
      if (selectedPlayers.size > 0) {
        const playerInserts = Array.from(selectedPlayers).map((userId) => ({
          game_day_id: selectedGameDay,
          team_id: selectedTeam,
          user_id: userId,
        }))

        const { error: playersError } = await supabase
          .from('game_day_players')
          .insert(playerInserts)

        if (playersError) throw playersError
      }

      setMessage({ type: 'success', text: 'Score and players reported successfully!' })

      // Refresh existing result
      const { data: result } = await supabase
        .from('game_results')
        .select('id, sets_won, sets_lost')
        .eq('game_day_id', selectedGameDay)
        .eq('team_id', selectedTeam)
        .single()

      if (result) {
        setExistingResult(result)
      }
    } catch (error) {
      console.error('Error reporting scores:', error)
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (myTeams.length === 0) {
    return (
      <div className="from-background to-muted/30 min-h-screen bg-gradient-to-b py-8">
        <div className="mx-auto max-w-4xl px-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Game Scores</CardTitle>
              <CardDescription>You need to be a team captain to report scores</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You are not currently a captain of any team. Create a team or ask to be made captain
                to report scores.
              </p>
              <Button onClick={() => router.push('/teams')}>Go to Teams</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="from-background to-muted/30 min-h-screen bg-gradient-to-b py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold">Report Game Scores</h1>
          <p className="text-muted-foreground mt-2">
            Submit your team&apos;s results and record who played
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Game</CardTitle>
            <CardDescription>Choose your team and the game day to report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="team">Your Team</Label>
              <select
                id="team"
                className="border-border bg-background mt-1 block w-full rounded-lg border p-2.5"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value)
                  setSelectedGameDay('')
                }}
              >
                <option value="">Select a team...</option>
                {myTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div>
                <Label htmlFor="gameDay">Game Day</Label>
                <select
                  id="gameDay"
                  className="border-border bg-background mt-1 block w-full rounded-lg border p-2.5"
                  value={selectedGameDay}
                  onChange={(e) => setSelectedGameDay(e.target.value)}
                >
                  <option value="">Select a game day...</option>
                  {gameDays.map((day) => (
                    <option key={day.id} value={day.id}>
                      {new Date(day.game_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      - {day.seasons.name}
                    </option>
                  ))}
                </select>
                {gameDays.length === 0 && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No game days found. Make sure your team is registered for a season.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTeam && selectedGameDay && (
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Game Result</CardTitle>
                <CardDescription>
                  Enter your team&apos;s sets won and lost
                  {existingResult && (
                    <span className="ml-2 text-[#4ade80]">(Updating existing result)</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="setsWon" className="mb-2 block">
                      Sets Won
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSetsWon((prev) => Math.max(0, (parseInt(prev) || 0) - 1).toString())
                        }
                        className="border-border bg-muted hover:bg-muted/80 hover:border-primary flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all"
                      >
                        −
                      </button>
                      <input
                        id="setsWon"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={setsWon}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setSetsWon(val)
                        }}
                        placeholder="0"
                        required
                        className="border-border bg-background focus:border-primary focus:ring-primary/20 h-12 flex-1 rounded-lg border-2 px-4 text-center text-xl font-semibold transition-all outline-none focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={() => setSetsWon((prev) => ((parseInt(prev) || 0) + 1).toString())}
                        className="border-border bg-muted hover:bg-muted/80 hover:border-primary flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="setsLost" className="mb-2 block">
                      Sets Lost
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSetsLost((prev) => Math.max(0, (parseInt(prev) || 0) - 1).toString())
                        }
                        className="border-border bg-muted hover:bg-muted/80 hover:border-primary flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all"
                      >
                        −
                      </button>
                      <input
                        id="setsLost"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={setsLost}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setSetsLost(val)
                        }}
                        placeholder="0"
                        required
                        className="border-border bg-background focus:border-primary focus:ring-primary/20 h-12 flex-1 rounded-lg border-2 px-4 text-center text-xl font-semibold transition-all outline-none focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSetsLost((prev) => ((parseInt(prev) || 0) + 1).toString())
                        }
                        className="border-border bg-muted hover:bg-muted/80 hover:border-primary flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Players Who Played</CardTitle>
                <CardDescription>Check all players who participated in this game</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <label
                        key={member.user_id}
                        className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors"
                      >
                        <Checkbox
                          checked={selectedPlayers.has(member.user_id)}
                          onCheckedChange={() => togglePlayer(member.user_id)}
                        />
                        <div>
                          <div className="font-medium">
                            {member.users.display_name || member.users.email.split('@')[0]}
                          </div>
                          <div className="text-muted-foreground text-sm">{member.users.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No team members found. Add players to your team first.
                  </p>
                )}

                {selectedPlayers.size > 0 && (
                  <p className="text-muted-foreground mt-4 text-sm">
                    {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            </Card>

            {message && (
              <div
                className={`mb-6 rounded-lg p-4 ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={saving || !setsWon || !setsLost}>
                {saving ? 'Saving...' : existingResult ? 'Update Result' : 'Submit Result'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/teams')}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
