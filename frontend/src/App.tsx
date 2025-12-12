// frontend/src/App.tsx
// Updated with EditPTW and Extension Approval Dashboard

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';
import Reports from './pages/admin/Reports';

// Supervisor Pages
import SupervisorDashboard from './components/supervisor/SupervisorDashboard';
import { CreatePTW } from './components/supervisor/CreatePTW';
import { WorkerList } from './components/supervisor/WorkerList';

// Approver Pages
import ApproverDashboard from './pages/approver/ApproverDashboard';
import EditPTW from './pages/approver/EditPTW';
import ExtensionApprovalDashboard from './components/approver/ExtensionApprovalDashboard';

// Common Pages
import PermitDetails from './pages/supervisor/PermitDetails';

interface User {
  id: number;
  login_id: string;
  name?: string;
  email: string;
  role: string;
  frontendRole?: string;
  full_name?: string;
  department?: string;
}

type PageType =
  | 'dashboard'
  | 'site-management'
  | 'user-management'
  | 'all-permits'
  | 'reports'
  | 'create-permit'
  | 'worker-list'
  | 'permit-detail'
  | 'permit-edit'
  | 'extension-approvals';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [approverTab, setApproverTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const initializeAuth = () => {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          handleLogout();
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string, data?: any) => {
    console.log('🔄 Navigation:', page, data);

    // Handle permit detail navigation FIRST
    if (page === 'permit-detail' && data?.permitId) {
      console.log('📄 Setting permit ID:', data.permitId);
      setSelectedPermitId(data.permitId);
      setCurrentPage('permit-detail');
      setIsMobileMenuOpen(false);
      return;
    }

    // Handle permit edit navigation
    if (page === 'permit-edit' && data?.permitId) {
      console.log('✏️ Setting permit ID for edit:', data.permitId);
      setSelectedPermitId(data.permitId);
      setCurrentPage('permit-edit');
      setIsMobileMenuOpen(false);
      return;
    }

    // Check if this is an approver tab navigation
    if (['pending', 'approved', 'rejected'].includes(page)) {
      setApproverTab(page as 'pending' | 'approved' | 'rejected');
      setCurrentPage('dashboard');
    } else {
      setCurrentPage(page as PageType);
    }

    setIsMobileMenuOpen(false);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
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
    userRole === 'approver_siteleader' ||
    userRole.includes('approver');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Admin Pages */}
          {isAdmin && (
            <>
              {currentPage === 'dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
              {currentPage === 'site-management' && <SiteManagement onBack={() => handleNavigate('dashboard')} />}
              {currentPage === 'user-management' && <UserManagement onBack={() => handleNavigate('dashboard')} />}
              {currentPage === 'all-permits' && <AllPermits onNavigate={handleNavigate} />}
              {currentPage === 'reports' && <Reports onBack={() => handleNavigate('dashboard')} />}
              {currentPage === 'permit-detail' && selectedPermitId && (
                <PermitDetails
                  ptwId={selectedPermitId}
                  onBack={() => handleNavigate('all-permits')}
                />
              )}
            </>
          )}

          {/* Supervisor Pages */}
          {isSupervisor && (
            <>
              {currentPage === 'dashboard' && (
                <SupervisorDashboard onNavigate={handleNavigate} />
              )}
              {currentPage === 'create-permit' && (
                <CreatePTW onBack={() => handleNavigate('dashboard')} />
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

          {/* Approver Pages - with Edit and Extension Approvals */}
          {isApprover && (
            <>
              {currentPage === 'dashboard' && (
                <ApproverDashboard
                  onNavigate={handleNavigate}
                  initialTab={approverTab}
                />
              )}
              {currentPage === 'permit-detail' && selectedPermitId && (
                <PermitDetails
                  ptwId={selectedPermitId}
                  onBack={() => handleNavigate('dashboard')}
                />
              )}
              {currentPage === 'permit-edit' && selectedPermitId && (
                <EditPTW
                  permitId={selectedPermitId}
                  onBack={() => handleNavigate('dashboard')}
                  onSave={() => {
                    handleNavigate('dashboard');
                    // Optionally refresh the dashboard
                  }}
                />
              )}
              {currentPage === 'extension-approvals' && (
                <ExtensionApprovalDashboard />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;