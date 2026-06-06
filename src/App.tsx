import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import EnsureProfile from "@/components/EnsureProfile";
import SplashScreen from "@/components/SplashScreen";
import FeedbackButton from "@/components/FeedbackButton";
import GlobalFooter from "@/components/GlobalFooter";
import Index from "./pages/Index.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.tsx";
import PlannerPage from "./pages/PlannerPage.tsx";
import ForumPage from "./pages/ForumPage.tsx";
import ForumDetailPage from "./pages/ForumDetailPage.tsx";
import PostDetailPage from "./pages/PostDetailPage.tsx";
import SkriptePage from "./pages/SkriptePage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import {
  DatenschutzPage,
  ImpressumPage,
  NutzungsordnungPage,
} from "./pages/LegalPages.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence>{booting && <SplashScreen />}</AnimatePresence>
          <BrowserRouter>
            <AuthProvider>
              <EnsureProfile>
              <div className="min-h-screen flex flex-col">
                <div className="flex-1 pb-24">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <AdminRoute><AdminDashboardPage /></AdminRoute>
                      }
                    />
                    <Route
                      path="/planner"
                      element={
                        <ProtectedRoute>
                          <PlannerPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forum"
                      element={
                        <ProtectedRoute>
                          <ForumPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forum/:forumId"
                      element={
                        <ProtectedRoute>
                          <ForumDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forum/:forumId/post/:postId"
                      element={
                        <ProtectedRoute>
                          <PostDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/skripte"
                      element={
                        <ProtectedRoute>
                          <SkriptePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/impressum" element={<ImpressumPage />} />
                    <Route path="/datenschutz" element={<DatenschutzPage />} />
                    <Route
                      path="/nutzungsordnung"
                      element={<NutzungsordnungPage />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <GlobalFooter />
              </div>
              <FeedbackButton />
              </EnsureProfile>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
