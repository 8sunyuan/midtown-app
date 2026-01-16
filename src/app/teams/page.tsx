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

  // Get user's teams server-side for initial data
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

  const initialTeams = teamsData?.map((tm: any) => tm.teams).filter(Boolean) || []

  return <TeamsClient user={user} initialTeams={initialTeams} />
}
