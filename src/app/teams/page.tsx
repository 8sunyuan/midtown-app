import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamsClient } from './teams-client'

export default async function TeamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = !!adminData

  let initialTeams: any[] = []

  if (isAdmin) {
    // Admins see all teams
    const { data: allTeams } = await supabase
      .from('teams')
      .select('id, name, captain_id, created_at')
      .order('name', { ascending: true })

    initialTeams = allTeams || []
  } else {
    // Regular users see only their teams
    const { data: teamsData } = await supabase
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

    initialTeams = teamsData?.map((tm: any) => tm.teams).filter(Boolean) || []
  }

  return <TeamsClient user={user} initialTeams={initialTeams} isAdmin={isAdmin} />
}
