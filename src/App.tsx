import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Diagnosis } from './pages/Diagnosis';
import { Layout } from './components/Layout';
import { Simulator } from './pages/Simulator';
import { MarketPulse } from './pages/MarketPulse'; // Import Market Pulse
import { ChatAssistant } from './pages/ChatAssistant';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatWidget } from './components/ChatWidget';

const App: React.FC = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_SERVICE_TOKEN || process.env.GEMINI_SERVICE_TOKEN;

  console.log('[App] Environment Check:', {
    VITE_KEY: !!import.meta.env.VITE_GEMINI_API_KEY,
    SERVICE_TOKEN: !!import.meta.env.GEMINI_SERVICE_TOKEN,
    PROCESS_TOKEN: !!process.env.GEMINI_SERVICE_TOKEN,
    FINAL_KEY_PRESENT: !!apiKey
  });

  return (
    <BrowserRouter>
      {/* 
        Only show warning if apiKey is strictly missing. 
        The console log above confirms state.
      */}
      {!apiKey && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-2 z-50">
          ⚠️ API Key Missing. AI features will not work. Please add GEMINI_SERVICE_TOKEN to .env
        </div>
      )}
      <Routes>
        {/* Simulator Standalone Route */}
        <Route path="/simulator" element={<Simulator />} />

        {/* Global Layout Routes */}
        <Route
          path="*"
          element={
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

                {/* Global Bottom Navigation for Mobile */}
                <MobileBottomNav />

                {/* Chat Widget */}
                <ChatWidget />
              </div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
