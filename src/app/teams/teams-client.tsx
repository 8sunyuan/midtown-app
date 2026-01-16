'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { User } from '@supabase/supabase-js'

type Team = {
  id: string
  name: string
  captain_id: string
  created_at: string
}

type TeamMember = {
  id: string
  user_id: string
  status: string
  users: {
    email: string
    display_name: string | null
  }
}

interface TeamsClientProps {
  user: User
  initialTeams: Team[]
}

export function TeamsClient({ user, initialTeams }: TeamsClientProps) {
  const [myTeams, setMyTeams] = useState<Team[]>(initialTeams)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [playerEmails, setPlayerEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const loadMyTeams = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        teams (
          id,
          name,
          captain_id,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    if (!error && data) {
      const teams = data.map((tm: any) => tm.teams).filter(Boolean)
      setMyTeams(teams)
    }
  }

  const loadTeamMembers = async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        status,
        users (
          email,
          display_name
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })

    if (!error && data) {
      setTeamMembers(data as TeamMember[])
    }
  }

  const openManageDialog = async (team: Team) => {
    setSelectedTeam(team)
    setError(null)
    setSuccess(null)
    setIsManageDialogOpen(true)
    await loadTeamMembers(team.id)
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          captain_id: user.id,
        })
        .select()
        .single()

      if (teamError) {
        if (teamError.code === '23505') {
          setError('A team with this name already exists')
        } else {
          setError('Failed to create team')
        }
        setLoading(false)
        return
      }

      // Add captain as accepted member
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          status: 'accepted',
        })

      // Add other players
      const validEmails = playerEmails.filter(email => email.trim() !== '')
      
      if (validEmails.length > 0) {
        // Check if adding these members would exceed the limit
        if (validEmails.length + 1 > 10) {
          setError('Team roster limit is 10 players (including captain)')
          setLoading(false)
          return
        }

        for (const email of validEmails) {
          // Find or create user
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.trim())
            .single()

          if (existingUser) {
            // Add as pending member
            await supabase
              .from('team_members')
              .insert({
                team_id: team.id,
                user_id: existingUser.id,
                status: 'accepted', // For now, auto-accept
              })
          }
        }
      }

      setSuccess('Team created successfully!')
      setIsCreateDialogOpen(false)
      setTeamName('')
      setPlayerEmails([''])
      loadMyTeams()
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const addPlayerEmail = () => {
    if (playerEmails.length + 1 >= 10) { // +1 for captain
      setError('Team roster limit is 10 players')
      return
    }
    setPlayerEmails([...playerEmails, ''])
  }

  const updatePlayerEmail = (index: number, value: string) => {
    const newEmails = [...playerEmails]
    newEmails[index] = value
    setPlayerEmails(newEmails)
  }

  const removePlayerEmail = (index: number) => {
    const newEmails = playerEmails.filter((_, i) => i !== index)
    setPlayerEmails(newEmails)
  }

  const handleAddPlayer = async () => {
    if (!selectedTeam) return

    const email = prompt('Enter player email:')
    if (!email) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Check current team size
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', selectedTeam.id)
        .eq('status', 'accepted')

      if (count && count >= 10) {
        setError('Team roster limit of 10 players reached')
        setLoading(false)
        return
      }

      // Find user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .single()

      if (!existingUser) {
        setError('User with this email not found')
        setLoading(false)
        return
      }

      // Add as member
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeam.id,
          user_id: existingUser.id,
          status: 'accepted',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Player is already on this team')
        } else {
          setError('Failed to add player')
        }
        setLoading(false)
        return
      }

      setSuccess('Player added successfully')
      loadTeamMembers(selectedTeam.id)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const handleRemovePlayer = async (memberId: string) => {
    if (!confirm('Remove this player from the team?')) return

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      setError('Failed to remove player')
    } else {
      setSuccess('Player removed')
      if (selectedTeam) {
        loadTeamMembers(selectedTeam.id)
      }
    }
  }

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
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Teams</h1>
            <p className="text-muted-foreground mt-2">Manage your volleyball teams</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Team
          </Button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-primary bg-primary/10 p-3 rounded-lg">
            {success}
          </div>
        )}

        {myTeams.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {myTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    {team.captain_id === user.id ? 'You are the captain' : 'Team member'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => openManageDialog(team)}
                  >
                    View Roster
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">You&apos;re not on any teams yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team and add up to 9 other players (10 total including you)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Player Emails (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add players who are already registered. You can add more later.
                </p>
                {playerEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="player@example.com"
                      value={email}
                      onChange={(e) => updatePlayerEmail(index, e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removePlayerEmail(index)}
                      disabled={loading || playerEmails.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {playerEmails.length < 9 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPlayerEmail}
                    disabled={loading}
                    className="w-full"
                  >
                    Add Another Player
                  </Button>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedTeam?.name}</DialogTitle>
              <DialogDescription>
                Team roster {teamMembers.filter(m => m.status === 'accepted').length}/10 players
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTeam?.captain_id === user?.id && (
                <Button onClick={handleAddPlayer} disabled={loading}>
                  Add Player
                </Button>
              )}
              
              {teamMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {selectedTeam?.captain_id === user?.id && (
                        <TableHead>Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.users.display_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{member.users.email}</TableCell>
                        <TableCell>
                          {member.user_id === selectedTeam?.captain_id ? (
                            <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                              Captain
                            </span>
                          ) : (
                            <span className="text-xs bg-muted text-muted-foreground font-medium px-2.5 py-1 rounded-full">
                              Member
                            </span>
                          )}
                        </TableCell>
                        {selectedTeam?.captain_id === user?.id && (
                          <TableCell>
                            {member.user_id !== selectedTeam.captain_id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemovePlayer(member.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No members yet
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

