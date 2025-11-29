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
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
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
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    console.log('🔍 App.tsx: Checking authentication...');
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Token exists:', !!token);
    console.log('User string exists:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ User loaded from localStorage:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('❌ Failed to parse user from localStorage:', error);
        handleLogout();
      }
    } else {
      console.log('❌ No token or user in localStorage');
    }
    
    setIsLoading(false);
  }, []);
/ Update just the handleLogin function in App.tsx
const handleLogin = (user: User) => {
  console.log('🔐 handleLogin called with user:', user);
  
  // IMPORTANT: Save to localStorage here too!
  localStorage.setItem('user', JSON.stringify(user));
  
  setCurrentUser(user);
  setCurrentPage('dashboard');
};
  // Monitor currentUser changes
  useEffect(() => {
    if (currentUser) {
      console.log('👤 Current user updated:', {
        login_id: currentUser.login_id,
        role: currentUser.role,
        frontendRole: currentUser.frontendRole
      });
    } else {
      console.log('👤 Current user: null (not logged in)');
    }
  }, [currentUser]);

  // Handle login
  const handleLogin = (user: User) => {
    console.log('🔐 handleLogin called with user:', user);
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    console.log('🚪 Logging out...');
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show auth pages
  if (!currentUser) {
    console.log('📄 Rendering auth routes (not logged in)');
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

  // User is logged in - show main app
  console.log('📄 Rendering main app (logged in)');
  
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
