import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { RealtimeNotificationProvider } from "@/components/Notifications/RealtimeNotificationProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// QueryClient создаётся вне компонента для предотвращения пересоздания
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем запросы при ошибках аутентификации
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
      networkMode: 'online', // Не делаем запросы оффлайн
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function App() {

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="cargo-app-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RealtimeNotificationProvider>
              <BrowserRouter>
                <TooltipProvider>
                  <Routes>
                    <Route path="/*" element={<Index />} />
                    <Route path="/404" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                </TooltipProvider>
              </BrowserRouter>
            </RealtimeNotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
