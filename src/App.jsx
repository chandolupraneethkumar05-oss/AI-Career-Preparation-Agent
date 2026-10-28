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
const SkillArenaPage = lazy(() => import('./pages/SkillArenaPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

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
                  <Route path="/interview-setup" element={<InterviewSetupPage />} />
                  <Route path="/interview-ready" element={<InterviewReadyPage />} />
                  <Route path="/mock-interview" element={<MockInterviewPage />} />
                  <Route path="/interview-feedback" element={<InterviewFeedbackPage />} />
                  <Route path="/skill-arena" element={<SkillArenaPage />} />
                  <Route path="/ats" element={<ATSScannerPage />} />
                  <Route path="/skill-gap" element={<SkillGapPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Clean consolidations for streamlined 6-hub navigation */}
                  <Route path="/daily-challenge" element={<Navigate to="/skill-arena?tab=daily" replace />} />
                  <Route path="/weekly-report" element={<Navigate to="/progress?tab=weekly" replace />} />
                  <Route path="/career-journey" element={<Navigate to="/progress?tab=milestones" replace />} />
                  <Route path="/achievements" element={<Navigate to="/progress?tab=milestones" replace />} />
                  <Route path="/interview-experiences" element={<Navigate to="/interview-setup" replace />} />
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
