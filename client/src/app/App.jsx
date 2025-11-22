import { useEffect } from 'react'
import AppRoutes from "./routes/routes"
import { AuthProvider } from "./providers/AuthProvider"
import { PaymentProvider } from "@features/payments/context/PaymentContext"
import { ChatProvider } from "@features/chat/context/ChatContext"
import { ErrorBoundary } from "@shared/components/ui"
import { Toaster } from 'react-hot-toast'
import { initializePerformanceMonitoring } from '@shared/utils/performance/performanceMonitoring'
import { mobileForms } from '@shared/utils/mobile/mobileOptimization'

function App() {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()
    
    // Initialize mobile optimizations
    mobileForms.preventZoom()
    
    // Cleanup on unmount
    return () => {
      mobileForms.restoreZoom()
    }
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PaymentProvider>
          <ChatProvider>
            <AppRoutes/>   
          </ChatProvider>
        </PaymentProvider>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App

