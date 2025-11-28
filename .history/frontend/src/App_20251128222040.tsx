// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';

// Supervisor Pages
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { CreatePTW } from './components/supervisor/CreatePTW';
import { WorkerList } from './components/supervisor/WorkerList';

// Common Components
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// User interface
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  created_at?: string;
}

// Page types
type PageType = 
  | 'dashboard' 
  | 'site-management' 
  | 'user-management' 
  | 'all-permits'
  | 'create-permit'
  | 'worker-list';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        handleLogout();
      }
    }
  }, []);

  // Handle login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  // Handle navigation
  const handleNavigate = (page: string) => {
    console.log('🚀 Navigating to:', page);
    setCurrentPage(page as PageType);
    setIsMobileMenuOpen(false);
  };

  // If not logged in, show auth pages
  if (!currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Main app interface
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 lg:ml-64">
        <Header
          currentUser={currentUser}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Admin Pages */}
          {currentPage === 'dashboard' && currentUser.role === 'Admin' && (
            <AdminDashboard />
          )}
          {currentPage === 'site-management' && <SiteManagement />}
          {currentPage === 'user-management' && <UserManagement />}
          {currentPage === 'all-permits' && <AllPermits />}

          {/* Supervisor Pages */}
          {currentPage === 'dashboard' && currentUser.role !== 'Admin' && (
            <SupervisorDashboard onNavigate={handleNavigate} />
          )}
          {currentPage === 'create-permit' && (
            <CreatePTW 
              onBack={() => handleNavigate('dashboard')} 
              onSuccess={() => handleNavigate('dashboard')}
            />
          )}
          {currentPage === 'worker-list' && (
            <WorkerList onBack={() => handleNavigate('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;