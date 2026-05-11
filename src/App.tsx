import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotificationManager from "@/components/NotificationManager";
import Auth from "./pages/Auth";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Feed = lazy(() => import("./pages/Feed"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Quests = lazy(() => import("./pages/Quests"));
const Admin = lazy(() => import("./pages/Admin"));
const GuideDashboard = lazy(() => import("./pages/GuideDashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const QuestPath = lazy(() => import("./pages/QuestPath"));
const Vote = lazy(() => import("./pages/Vote"));
const VoteQr = lazy(() => import("./pages/VoteQr"));
const VoteShared = lazy(() => import("./pages/VoteShared"));
const VoteAdmin = lazy(() => import("./pages/VoteAdmin"));
const Club = lazy(() => import("./pages/Club"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} replace />;
  if (profile && !profile.onboarded) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationManager />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground animate-pulse">Loading...</p></div>}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/quests" element={<ProtectedRoute><Quests /></ProtectedRoute>} />
              <Route path="/quest-path" element={<ProtectedRoute><QuestPath /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/guide" element={<ProtectedRoute><GuideDashboard /></ProtectedRoute>} />
              <Route path="/vote" element={<Vote />} />
              <Route path="/vote-qr" element={<VoteQr />} />
              <Route path="/vote/shared" element={<VoteShared />} />
              <Route path="/leaderboard-vote" element={<Navigate to="/leaderboard" replace />} />
              <Route path="/vote-admin" element={<ProtectedRoute><VoteAdmin /></ProtectedRoute>} />
              <Route path="/club" element={<ProtectedRoute><Club /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
