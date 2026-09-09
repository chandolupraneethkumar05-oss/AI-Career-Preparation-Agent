import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewReadyPage from './pages/InterviewReadyPage';
import MockInterviewPage from './pages/MockInterviewPage';
import InterviewFeedbackPage from './pages/InterviewFeedbackPage';
import SkillGapPage from './pages/SkillGapPage';
import ATSScannerPage from './pages/ATSScannerPage';
import DailyChallengePage from './pages/DailyChallengePage';
import ProgressPage from './pages/ProgressPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
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
            <Route path="/skill-gap" element={<SkillGapPage />} />
            <Route path="/ats" element={<ATSScannerPage />} />
            <Route path="/daily-challenge" element={<DailyChallengePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InterviewProvider>
    </AuthProvider>
  );
}
