interface LoadingSpinnerProps {
  fullscreen?: boolean
}

export const LoadingSpinner = ({ fullscreen }: LoadingSpinnerProps) => {
  if (fullscreen) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center p-4">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
