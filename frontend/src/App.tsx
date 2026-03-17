import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { queryClient } from '@/lib/queryClient'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

import { useAuthSocket } from '@/hooks/use-socket'

function App() {
  useAuthSocket()
  
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingSpinner fullscreen />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

export default App
