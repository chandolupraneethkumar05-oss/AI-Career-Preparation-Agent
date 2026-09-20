import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Lazy-loaded routes for code-splitting and faster initial bundle loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InterviewSetupPage = lazy(() => import('./pages/InterviewSetupPage'));
const InterviewReadyPage = lazy(() => import('./pages/InterviewReadyPage'));
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'));
const InterviewFeedbackPage = lazy(() => import('./pages/InterviewFeedbackPage'));
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'));
const ATSScannerPage = lazy(() => import('./pages/ATSScannerPage'));
const DailyChallengePage = lazy(() => import('./pages/DailyChallengePage'));
const SkillArenaPage = lazy(() => import('./pages/SkillArenaPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const InterviewExperiencesPage = lazy(() => import('./pages/InterviewExperiencesPage'));
const CareerJourneyPage = lazy(() => import('./pages/CareerJourneyPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InterviewProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing & Authentication */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Authenticated Application Shell */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/career-journey" element={<CareerJourneyPage />} />
                  <Route path="/weekly-report" element={<WeeklyReportPage />} />
                  <Route path="/interview-setup" element={<InterviewSetupPage />} />
                  <Route path="/interview-ready" element={<InterviewReadyPage />} />
                  <Route path="/mock-interview" element={<MockInterviewPage />} />
                  <Route path="/interview-feedback" element={<InterviewFeedbackPage />} />
                  <Route path="/skill-gap" element={<SkillGapPage />} />
                  <Route path="/ats" element={<ATSScannerPage />} />
                  <Route path="/daily-challenge" element={<DailyChallengePage />} />
                  <Route path="/skill-arena" element={<SkillArenaPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/interview-experiences" element={<InterviewExperiencesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Clean redirect for legacy /assistant route */}
                  <Route path="/assistant" element={<Navigate to="/dashboard" replace />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
