-- Allow admins to delete any team
CREATE POLICY "Admins can delete any team" ON public.teams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
