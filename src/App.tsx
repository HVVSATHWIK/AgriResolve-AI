import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Diagnosis } from './pages/Diagnosis';
import { Layout } from './components/Layout';
import { Simulator } from './pages/Simulator';
import { MarketPulse } from './pages/MarketPulse'; // Import Market Pulse
import { ChatAssistant } from './pages/ChatAssistant';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ChatWidget } from './components/ChatWidget';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  // API Key check removed as we now use Backend Proxy.

  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Simulator Standalone Route - Public for now */}
          <Route path="/simulator" element={<Simulator />} />

          {/* Protected Routes with Global Layout */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="min-h-screen font-inter text-gray-900 pb-16 md:pb-0">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/diagnosis" element={<Diagnosis />} />
                      <Route path="/market" element={<MarketPulse />} />
                      <Route path="/chat" element={<ChatAssistant />} />
                      {/* Redirect unknown routes to Dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    {/* Chat Widget */}
                    <ChatWidget />
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
