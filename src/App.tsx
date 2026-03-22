import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import MembersPage from "./pages/MembersPage";
import AttendancePage from "./pages/AttendancePage";
import DailyBreadPage from "./pages/DailyBreadPage";
import EvangelismPage from "./pages/EvangelismPage";
import TestsPage from "./pages/TestsPage";
import DepartmentPage from "./pages/DepartmentPage";
import MinistryPage from "./pages/MinistryPage";
import ReportsPage from "./pages/ReportsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/departments/:deptId" element={<DepartmentPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/daily-bread" element={<DailyBreadPage />} />
            <Route path="/evangelism" element={<EvangelismPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/ministries/:ministryId" element={<MinistryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
