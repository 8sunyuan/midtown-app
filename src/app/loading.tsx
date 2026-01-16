import { LoadingSpinner } from '@/components/ui/loading'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

