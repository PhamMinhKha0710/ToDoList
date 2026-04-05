import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { queryClient } from '@/lib/queryClient'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

import { useAuthSocket, useNotificationSocket } from '@/hooks/use-socket'

const SocketWrapper = () => {
  useAuthSocket()
  useNotificationSocket()
  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketWrapper />
      <Suspense fallback={<LoadingSpinner fullscreen />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

export default App
