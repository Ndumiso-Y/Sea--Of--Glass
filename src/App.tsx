import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PortalPage from "./pages/PortalPage";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
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
import ProfilePage from "./pages/ProfilePage";
import MemberLayout from "./components/MemberLayout";
import MemberHomePage from "./pages/member/MemberHomePage";
import FinancePage from "./pages/FinancePage";
import NotFound from "./pages/NotFound";
import type { Role } from "@/data/types";

// ── Role access matrix ──────────────────────────────────────────────────────
// Keep in sync with AppSidebar nav visibility rules.
// Type annotation ensures every entry only contains valid Role values.
const R: Record<string, Role[]> = {
  gsn_smn:       ['GSN', 'SMN'],
  members:       ['GSN', 'SMN', 'HJN', 'SGN', 'GYJN', 'IWN'],
  overview:      ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'],
  attendance:    ['GSN', 'SMN', 'HJN', 'SGN', 'GYJN', 'IWN', 'JJN', 'GGN'],
  evangelism:    ['GSN', 'SMN', 'HJN', 'SGN', 'BJN', 'JJN', 'GGN', 'GYJN'],
  tests:         ['GSN', 'SMN', 'HJN', 'SGN', 'GYJN', 'JDSN'],
  ministries:    ['GSN', 'SMN', 'BJN', 'JDSN', 'CULTURE'],
  reports:       ['GSN', 'SMN', 'HJN', 'BJN'],
  announcements: ['GSN', 'SMN', 'HJN', 'SGN', 'BJN', 'JJN', 'GGN', 'IWN', 'GYJN', 'JDSN', 'CULTURE', 'MEMBER'],
  all:           ['GSN', 'SMN', 'HJN', 'SGN', 'BJN', 'JJN', 'GGN', 'IWN', 'GYJN', 'JDSN', 'CULTURE', 'MEMBER'],
};

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter basename="/Sea--Of--Glass/">
        <Routes>
          <Route path="/" element={<PortalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Member portal — separate layout, no sidebar */}
          <Route element={<ProtectedRoute roles={['MEMBER']}><MemberLayout /></ProtectedRoute>}>
            <Route path="/member" element={<MemberHomePage />} />
          </Route>

          {/* Layout shell — auth only, no role restriction */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

            <Route path="/dashboard"
              element={<ProtectedRoute roles={R.gsn_smn}><DashboardPage /></ProtectedRoute>}
            />
            <Route path="/members"
              element={<ProtectedRoute roles={R.members}><MembersPage /></ProtectedRoute>}
            />
            <Route path="/departments/:deptId"
              element={<ProtectedRoute roles={R.overview}><DepartmentPage /></ProtectedRoute>}
            />
            <Route path="/attendance"
              element={<ProtectedRoute roles={R.attendance}><AttendancePage /></ProtectedRoute>}
            />
            <Route path="/daily-bread"
              element={<ProtectedRoute roles={R.overview}><DailyBreadPage /></ProtectedRoute>}
            />
            <Route path="/evangelism"
              element={<ProtectedRoute roles={R.evangelism}><EvangelismPage /></ProtectedRoute>}
            />
            <Route path="/tests"
              element={<ProtectedRoute roles={R.tests}><TestsPage /></ProtectedRoute>}
            />
            <Route path="/ministries/:ministryId"
              element={<ProtectedRoute roles={R.ministries}><MinistryPage /></ProtectedRoute>}
            />
            <Route path="/reports"
              element={<ProtectedRoute roles={R.reports}><ReportsPage /></ProtectedRoute>}
            />
            <Route path="/announcements"
              element={<ProtectedRoute roles={R.announcements}><AnnouncementsPage /></ProtectedRoute>}
            />
            <Route path="/settings"
              element={<ProtectedRoute roles={R.gsn_smn}><SettingsPage /></ProtectedRoute>}
            />
            <Route path="/profile"
              element={<ProtectedRoute roles={R.all}><ProfilePage /></ProtectedRoute>}
            />
            <Route path="/contributions"
              element={<ProtectedRoute roles={['GSN','HJN','SGN','GYJN','IWN','MEMBER']}><FinancePage /></ProtectedRoute>}
            />

          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
