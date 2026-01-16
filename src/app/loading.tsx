import { LoadingSpinner } from '@/components/ui/loading'

export default function Loading() {
  return (
    <div className="from-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-b">
      <LoadingSpinner />
    </div>
  )
}
