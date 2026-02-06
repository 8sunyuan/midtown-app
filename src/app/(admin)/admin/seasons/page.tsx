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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

type Season = {
  id: string
  name: string
  start_date: string
  end_date: string
  recurring_config: any
  status: string
  created_at: string
}

type Team = {
  id: string
  name: string
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    day_of_week: '5', // Friday
    time: '19:00',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSeasons()
    loadTeams()
  }, [])

  const loadSeasons = async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSeasons(data)
    }
  }

  const loadTeams = async () => {
    const { data, error } = await supabase.from('teams').select('id, name').order('name')

    if (!error && data) {
      setTeams(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const recurringConfig = {
      day_of_week: parseInt(formData.day_of_week),
      time: formData.time,
      exclude_dates: [],
    }

    const { data, error: insertError } = await supabase
      .from('seasons')
      .insert({
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        recurring_config: recurringConfig,
        status: 'draft',
      } as any)
      .select()
      .single()

    if (insertError) {
      setError('Failed to create season')
      setLoading(false)
      return
    }

    setSuccess('Season created successfully')
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      day_of_week: '5',
      time: '19:00',
    })
    loadSeasons()
    setLoading(false)
  }

  const generateGameDays = async (season: Season) => {
    if (
      !confirm(
        'Generate game days for this season? This will create game day entries based on the recurring schedule.'
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const config = season.recurring_config
    const startDate = new Date(season.start_date)
    const endDate = new Date(season.end_date)
    const gameDays: any[] = []

    // Find the first occurrence of the day_of_week
    let currentDate = new Date(startDate)
    while (currentDate.getDay() !== config.day_of_week) {
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Generate all game days
    while (currentDate <= endDate) {
      gameDays.push({
        season_id: season.id,
        game_date: currentDate.toISOString().split('T')[0],
      })
      currentDate.setDate(currentDate.getDate() + 7) // Next week
    }

    const { error: insertError } = await supabase.from('game_days').insert(gameDays as any)

    if (insertError) {
      setError('Failed to generate game days')
    } else {
      setSuccess(`Generated ${gameDays.length} game days`)
    }

    setLoading(false)
  }

  const updateStatus = async (seasonId: string, newStatus: 'draft' | 'active' | 'completed') => {
    const { error } = await (supabase
      .from('seasons')
      .update as any)({ status: newStatus })
      .eq('id', seasonId)

    if (error) {
      setError('Failed to update season status')
    } else {
      setSuccess('Season status updated')
      loadSeasons()
    }
  }

  const openTeamDialog = async (seasonId: string) => {
    setCurrentSeasonId(seasonId)

    // Load already selected teams for this season
    const { data } = await supabase.from('season_teams').select('team_id').eq('season_id', seasonId)

    if (data) {
      setSelectedTeams(new Set((data as any).map((st: any) => st.team_id)))
    }

    setIsTeamDialogOpen(true)
  }

  const saveTeams = async () => {
    if (!currentSeasonId) return

    setLoading(true)
    setError(null)

    // Delete existing teams
    await supabase.from('season_teams').delete().eq('season_id', currentSeasonId)

    // Insert selected teams
    const teamsToInsert = Array.from(selectedTeams).map((teamId) => ({
      season_id: currentSeasonId,
      team_id: teamId,
    }))

    if (teamsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('season_teams').insert(teamsToInsert as any)

      if (insertError) {
        setError('Failed to save teams')
        setLoading(false)
        return
      }
    }

    setSuccess('Teams updated successfully')
    setIsTeamDialogOpen(false)
    setLoading(false)
  }

  const toggleTeam = (teamId: string) => {
    const newSelected = new Set(selectedTeams)
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId)
    } else {
      newSelected.add(teamId)
    }
    setSelectedTeams(newSelected)
  }

  const deleteSeason = async (seasonId: string, seasonName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${seasonName}"? This will also delete all associated game days and results. This cannot be undone.`
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Delete game day results first
      const { data: gameDays } = await supabase
        .from('game_days')
        .select('id')
        .eq('season_id', seasonId)

      if (gameDays && gameDays.length > 0) {
        const gameDayIds = (gameDays as any).map((gd: any) => gd.id)
        await supabase.from('game_day_results').delete().in('game_day_id', gameDayIds)
      }

      // Delete game days
      await supabase.from('game_days').delete().eq('season_id', seasonId)

      // Delete season teams
      await supabase.from('season_teams').delete().eq('season_id', seasonId)

      // Delete the season
      const { error: deleteError } = await supabase.from('seasons').delete().eq('id', seasonId)

      if (deleteError) {
        setError('Failed to delete season')
      } else {
        setSuccess('Season deleted successfully')
        loadSeasons()
      }
    } catch (err) {
      setError('An error occurred while deleting the season')
    }

    setLoading(false)
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
            <h1 className="text-foreground text-3xl font-bold">Manage Seasons</h1>
            <p className="text-muted-foreground mt-2">Create and manage league seasons</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">{success}</div>
        )}

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Season</CardTitle>
              <CardDescription>Set up a new league season with recurring schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Season Name</Label>
                  <Input
                    id="name"
                    placeholder="Fall 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Game Day</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Game Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Season'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Existing Seasons</CardTitle>
            <CardDescription>Manage your league seasons</CardDescription>
          </CardHeader>
          <CardContent>
            {seasons.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell>
                        {new Date(season.start_date).toLocaleDateString()} -{' '}
                        {new Date(season.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {dayNames[season.recurring_config.day_of_week]} at{' '}
                        {season.recurring_config.time}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={season.status}
                          onValueChange={(value) =>
                            updateStatus(season.id, value as 'draft' | 'active' | 'completed')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTeamDialog(season.id)}
                          >
                            Teams
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateGameDays(season)}
                            disabled={loading}
                          >
                            Generate Days
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => deleteSeason(season.id, season.name)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-gray-500">No seasons created yet</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Teams for Season</DialogTitle>
              <DialogDescription>
                Choose which teams will participate in this season
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={team.id}
                    checked={selectedTeams.has(team.id)}
                    onCheckedChange={() => toggleTeam(team.id)}
                  />
                  <label
                    htmlFor={team.id}
                    className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {team.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveTeams} disabled={loading}>
                {loading ? 'Saving...' : 'Save Teams'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
