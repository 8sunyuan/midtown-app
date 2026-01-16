export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center ${className || ''}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

