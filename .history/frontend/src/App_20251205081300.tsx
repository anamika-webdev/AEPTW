// FIXED App.tsx - Proper Role-Based Routing
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';
import SupervisorDashboard from './components/supervisor/SupervisorDashboard';
import ApproverDashboard from './pages/approver/ApproverDashboard';
import { CreatePTW } from './components/supervisor/CreatePTW';
import PermitDetails from './pages/supervisor/PermitDetails';
import { WorkerList } from './components/supervisor/WorkerList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Reports from './pages/admin/Reports';

interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: string;
  department?: string;
  created_at?: string;
}

type PageType = 'dashboard' | 'site-management' | 'user-management' | 'all-permits' | 'create-permit' | 'worker-list' | 'permit-detail' | 'reports';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔄 Restored user session:', user);
        console.log('👤 Frontend Role:', user.frontendRole);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    
    setIsInitialized(true);
  }, [isInitialized]);

  const handleLogin = (user: User) => {
    console.log('✅ Login handler called with user:', user);
    console.log('🎭 Frontend Role:', user.frontendRole);
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string, data?: any) => {
    console.log('🔄 Navigation:', page, data);
    setCurrentPage(page as PageType);
    setIsMobileMenuOpen(false);
    
    if (page === 'permit-detail' && data?.permitId) {
      console.log('📄 Setting permit ID:', data.permitId);
      setSelectedPermitId(data.permitId);
    }
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

  // Determine user role - check both frontendRole and role fields
  const userRole = (currentUser.frontendRole || currentUser.role || '').toLowerCase();
  
  console.log('🔍 Current user role:', userRole);
  
  const isAdmin = userRole === 'admin' || userRole === 'administrator';
  const isSupervisor = userRole === 'supervisor' || userRole === 'requester';
  const isApprover = 
    userRole === 'approver_areamanager' || 
    userRole === 'approver_safety' || 
    userRole === 'approver_siteleader';

  console.log('📊 Role checks:', { isAdmin, isSupervisor, isApprover });

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
          {isAdmin && (
            <>
              {currentPage === 'dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
              {currentPage === 'site-management' && <SiteManagement />}
              {currentPage === 'user-management' && <UserManagement />}
              {currentPage === 'all-permits' && <AllPermits />}
              {currentPage === 'reports' && <Reports />}
            </>
          )}
          
          {/* Supervisor Pages */}
          {isSupervisor && (
            <>
              {currentPage === 'dashboard' && (
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
              {currentPage === 'permit-detail' && selectedPermitId && (
                <PermitDetails 
                  ptwId={selectedPermitId} 
                  onBack={() => handleNavigate('dashboard')} 
                />
              )}
            </>
          )}
          
          {/* Approver Pages */}
          {isApprover && (
            <>
              {currentPage === 'dashboard' && <ApproverDashboard />}
              {currentPage === 'permit-detail' && selectedPermitId && (
                <PermitDetails 
                  ptwId={selectedPermitId} 
                  onBack={() => handleNavigate('dashboard')} 
                />
              )}
            </>
          )}
          
          {/* Fallback if no role matches */}
          {!isAdmin && !isSupervisor && !isApprover && (
            <div className="flex items-center justify-center min-h-screen">
              <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Access Error</h2>
                <p className="mb-6 text-gray-600">
                  Your role "{currentUser.frontendRole || currentUser.role}" is not recognized.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;