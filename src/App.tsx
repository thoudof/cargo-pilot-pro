
import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner"; // Удаляем Sonner
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useMemo } from "react";

function App() {
  // Мемоизируем QueryClient для предотвращения пересоздания
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000, // 10 минут
      },
      mutations: {
        retry: 1,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Routes>
              <Route path="/*" element={<Index />} />
              <Route path="/404" element={<NotFound />} />
            </Routes>
            <Toaster />
            {/* <Sonner /> */} {/* Удаляем Sonner компонент */}
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
