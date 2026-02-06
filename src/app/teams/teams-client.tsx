'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

type TeamInvite = {
  id: string
  email: string
  created_at: string
}

interface TeamsClientProps {
  user: User
  initialTeams: Team[]
}

export function TeamsClient({ user, initialTeams }: TeamsClientProps) {
  const [myTeams, setMyTeams] = useState<Team[]>(initialTeams)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [playerEmails, setPlayerEmails] = useState<string[]>([''])
  const [newPlayerEmail, setNewPlayerEmail] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const loadMyTeams = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
        teams (
          id,
          name,
          captain_id,
          created_at
        )
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    if (!error && data) {
      const teams = data.map((tm: any) => tm.teams).filter(Boolean)
      setMyTeams(teams)
    }
  }

  const loadTeamMembers = async (teamId: string) => {
    // Load team members
    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
        id,
        user_id,
        status,
        users (
          email,
          display_name
        )
      `
      )
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })

    if (!error && data) {
      setTeamMembers(data as TeamMember[])
    }

    // Load pending invites
    const { data: invites } = await supabase
      .from('team_invites')
      .select('id, email, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })

    setPendingInvites((invites || []) as TeamInvite[])
  }

  const openManageDialog = async (team: Team) => {
    setSelectedTeam(team)
    setError(null)
    setSuccess(null)
    setNewPlayerEmail('')
    setPendingInvites([])
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
        } as any)
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
      await supabase.from('team_members').insert({
        team_id: (team as any).id,
        user_id: user.id,
        status: 'accepted',
      } as any)

      // Add other players
      const validEmails = playerEmails.filter((email) => email.trim() !== '')

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
            await supabase.from('team_members').insert({
              team_id: (team as any).id,
              user_id: (existingUser as any).id,
              status: 'accepted', // For now, auto-accept
            } as any)
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
    if (playerEmails.length + 1 >= 10) {
      // +1 for captain
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

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam || !newPlayerEmail.trim()) return

    const email = newPlayerEmail.trim().toLowerCase()

    setError(null)
    setSuccess(null)
    setAddingPlayer(true)

    try {
      // Check current team size (members + pending invites)
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', selectedTeam.id)
        .eq('status', 'accepted')

      const { count: inviteCount } = await supabase
        .from('team_invites')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', selectedTeam.id)

      const totalCount = (memberCount || 0) + (inviteCount || 0)
      if (totalCount >= 10) {
        setError('Team roster limit of 10 players reached (including pending invites)')
        setAddingPlayer(false)
        return
      }

      // Check if already invited
      const { data: existingInvite } = await supabase
        .from('team_invites')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .ilike('email', email)
        .single()

      if (existingInvite) {
        setError('This email has already been invited')
        setAddingPlayer(false)
        return
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .single()

      if (existingUser) {
        // User exists - add directly to team
        const { error: insertError } = await supabase.from('team_members').insert({
          team_id: selectedTeam.id,
          user_id: (existingUser as any).id,
          status: 'accepted',
        } as any)

        if (insertError) {
          if (insertError.code === '23505') {
            setError('Player is already on this team')
          } else {
            setError('Failed to add player')
          }
          setAddingPlayer(false)
          return
        }

        setSuccess('Player added successfully!')
      } else {
        // User doesn't exist - create invite
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          setError('Not authenticated')
          setAddingPlayer(false)
          return
        }

        const { error: inviteError } = await supabase.from('team_invites').insert({
          team_id: selectedTeam.id,
          email: email,
          invited_by: currentUser.id,
        } as any)

        if (inviteError) {
          setError('Failed to send invite')
          setAddingPlayer(false)
          return
        }

        setSuccess('Invite sent! Player will be added when they register.')
      }

      setNewPlayerEmail('')
      loadTeamMembers(selectedTeam.id)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setAddingPlayer(false)
  }

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase.from('team_invites').delete().eq('id', inviteId)

    if (error) {
      setError('Failed to cancel invite')
    } else {
      setSuccess('Invite cancelled')
      if (selectedTeam) {
        loadTeamMembers(selectedTeam.id)
      }
    }
  }

  const handleRemovePlayer = async (memberId: string) => {
    if (!confirm('Remove this player from the team?')) return

    const { error } = await supabase.from('team_members').delete().eq('id', memberId)

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
    <div className="from-background to-muted/30 relative min-h-screen overflow-hidden bg-gradient-to-b py-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[700px] w-[1000px] opacity-[0.03]">
          <img
            src="/images/volleyball-players-light.png"
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold">My Teams</h1>
            <p className="text-muted-foreground mt-2">Manage your volleyball teams</p>
          </div>
          <div className="flex gap-3">
            <Link href="/teams/report">
              <Button
                variant="outline"
                className="border-[#4ade80]/50 bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80] hover:text-black"
              >
                📊 Report Scores
              </Button>
            </Link>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Team</Button>
          </div>
        </div>

        {error && (
          <div className="text-destructive bg-destructive/10 mb-4 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="text-primary bg-primary/10 mb-4 rounded-lg p-3 text-sm">{success}</div>
        )}

        {myTeams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {myTeams.map((team) => (
              <Card
                key={team.id}
                className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    {team.captain_id === user.id ? 'You are the captain' : 'Team member'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => openManageDialog(team)}>
                    View Roster
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You&apos;re not on any teams yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Team</Button>
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
                <p className="text-muted-foreground text-sm">
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
                <div className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
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
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTeam?.name}</DialogTitle>
              <DialogDescription>
                Team roster: {teamMembers.filter((m) => m.status === 'accepted').length} players
                {pendingInvites.length > 0 && ` + ${pendingInvites.length} pending`} / 10 max
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Add Player Form */}
              {selectedTeam?.captain_id === user?.id && (
                <form onSubmit={handleAddPlayer} className="space-y-3">
                  <Label htmlFor="newPlayerEmail">Add Player by Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newPlayerEmail"
                      type="email"
                      placeholder="player@example.com"
                      value={newPlayerEmail}
                      onChange={(e) => setNewPlayerEmail(e.target.value)}
                      disabled={addingPlayer}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={addingPlayer || !newPlayerEmail.trim()}>
                      {addingPlayer ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    If the player isn&apos;t registered yet, they&apos;ll be added automatically
                    when they sign up.
                  </p>
                </form>
              )}

              {error && (
                <div className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-primary bg-primary/10 rounded-lg p-3 text-sm">{success}</div>
              )}

              {/* Team Members Table */}
              {teamMembers.length > 0 ? (
                <div>
                  <h3 className="mb-2 font-medium">Current Members</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        {selectedTeam?.captain_id === user?.id && <TableHead>Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.users.display_name || 'Unknown'}</TableCell>
                          <TableCell>{member.users.email}</TableCell>
                          <TableCell>
                            {member.user_id === selectedTeam?.captain_id ? (
                              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
                                Captain
                              </span>
                            ) : (
                              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
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
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center">No members yet</p>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-medium">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                    Pending Invites
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Invited</TableHead>
                        {selectedTeam?.captain_id === user?.id && <TableHead>Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvites.map((invite) => (
                        <TableRow key={invite.id} className="bg-amber-500/5">
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invite.created_at).toLocaleDateString()}
                          </TableCell>
                          {selectedTeam?.captain_id === user?.id && (
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelInvite(invite.id)}
                              >
                                Cancel
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-muted-foreground mt-2 text-xs">
                    These players will be automatically added when they create an account.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
