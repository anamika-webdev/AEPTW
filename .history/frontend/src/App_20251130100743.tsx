import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { CreatePTW } from './components/supervisor/CreatePTW';
import { WorkerList } from './components/supervisor/WorkerList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

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

type PageType = 'dashboard' | 'site-management' | 'user-management' | 'all-permits' | 'create-permit' | 'worker-list';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    
    setIsInitialized(true);
  }, [isInitialized]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
    setIsMobileMenuOpen(false);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

  // Check BOTH role field AND frontendRole field
  const userRole = currentUser.role?.toLowerCase();
  const frontendRole = currentUser.frontendRole?.toLowerCase();
  
  const isAdmin = 
    userRole === 'admin' || 
    userRole === 'administrator' ||
    frontendRole === 'admin';

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
          {currentPage === 'dashboard' && isAdmin && <AdminDashboard />}
          {currentPage === 'dashboard' && !isAdmin && <SupervisorDashboard onNavigate={handleNavigate} />}
          {currentPage === 'site-management' && <SiteManagement />}
          {currentPage === 'user-management' && <UserManagement />}
          {currentPage === 'all-permits' && <AllPermits />}
          {currentPage === 'create-permit' && <CreatePTW onBack={() => handleNavigate('dashboard')} onSuccess={() => handleNavigate('dashboard')} />}
          {currentPage === 'worker-list' && <WorkerList onBack={() => handleNavigate('dashboard')} />}
        </main>
      </div>
    </div>
  );
}

export default App;