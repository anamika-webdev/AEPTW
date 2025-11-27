// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AuthCallback from './pages/auth/AuthCallback';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// User interface that matches backend response
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string; // Database role: Admin, Approver_Safety, Approver_AreaManager, Requester
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker'; // Mapped role for UI
  department?: string;
  signature_url?: string;
  created_at?: string;
  auth_provider?: 'local' | 'google';
}

// Role Mapping Function - ONLY Admin gets Admin Dashboard
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  // Only Admin role gets Admin Dashboard
  if (dbRole === 'Admin') {
    return 'Admin';
  }
  // ALL OTHER ROLES (Requester, Approver_Safety, Approver_AreaManager) get Supervisor Dashboard
  return 'Supervisor';
}

// Session Security Functions
const isTokenExpired = (): boolean => {
  const expiryStr = localStorage.getItem('tokenExpiry');
  if (!expiryStr) return true;
  
  const expiry = parseInt(expiryStr);
  return Date.now() > expiry;
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
  sessionStorage.clear();
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr && !isTokenExpired()) {
      try {
        const user = JSON.parse(userStr);
        const mappedUser = {
          ...user,
          frontendRole: mapDatabaseRoleToFrontend(user.role),
        };
        setCurrentUser(mappedUser);
        
        // Set initial page based on role
        if (mappedUser.frontendRole === 'Admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('supervisor-dashboard');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User, token: string) => {
    // Map database role to frontend role
    const mappedUser = {
      ...user,
      frontendRole: mapDatabaseRoleToFrontend(user.role),
    };

    // Store token with expiry (24 hours)
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    localStorage.setItem('user', JSON.stringify(mappedUser));

    setCurrentUser(mappedUser);
    
    // Navigate to appropriate dashboard
    if (mappedUser.frontendRole === 'Admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('supervisor-dashboard');
    }

    console.log('✅ Login successful:', {
      role: mappedUser.role,
      frontendRole: mappedUser.frontendRole,
      dashboardType: mappedUser.frontendRole === 'Admin' ? 'Admin Portal' : 'Supervisor Dashboard',
      authProvider: mappedUser.auth_provider
    });
  };

  const handleLogout = () => {
    console.log('👋 User logged out');
    clearSession();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    console.log('📍 Navigating to:', page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show auth routes
  if (!currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/google/callback" element={<AuthCallback onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Render dashboard based on user role
  const renderDashboard = () => {
    const frontendRole = currentUser?.frontendRole;
    
    console.log('🎯 Rendering dashboard:', { 
      currentPage, 
      frontendRole,
      databaseRole: currentUser?.role 
    });
    
    // ONLY Admin gets Admin Dashboard
    if (frontendRole === 'Admin') {
      return <AdminDashboard />;
    }
    
    // ALL OTHER ROLES get Supervisor Dashboard
    if (frontendRole === 'Supervisor') {
      return <SupervisorDashboard />;
    }
    
    // Fallback (should never reach here)
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Welcome to Amazon EPTW</h1>
          <p className="text-gray-600">Please contact your administrator for access.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <Header
          currentUser={currentUser}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dashboard Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {renderDashboard()}
        </main>
      </div>
    </div>
  );
}