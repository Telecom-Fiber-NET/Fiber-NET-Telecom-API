import React, { useEffect, useState } from 'react';
import { Navigate, Route, HashRouter as Router, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublicInvoice from './pages/PublicInvoice';
import { apiService } from './services/apiService';

// Auth Guard Component
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      setIsCheckingSession(true);
      const isValid = await apiService.validateSession();
      if (!isActive) return;
      setHasValidSession(isValid);
      setIsCheckingSession(false);
    };

    checkSession();

    const handleAuthChange = () => {
      checkSession();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      isActive = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [location.pathname]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-connect-light">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-connect-blue"></div>
      </div>
    );
  }

  if (!hasValidSession) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-connect-light font-sans">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/segunda-via" element={<PublicInvoice />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
