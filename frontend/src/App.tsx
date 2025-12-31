// frontend/src/App.tsx
// Updated with EditPTW and Extension Approval Dashboard

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { getHighestPriorityRole } from './utils/roleMapper';
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
import { authAPI } from './services/api';
import ApproverDashboard from './pages/approver/ApproverDashboard';
import EditPTW from './pages/approver/EditPTW';
import ExtensionApprovalDashboard from './components/approver/ExtensionApprovalDashboard';

import PermitDetails from './pages/supervisor/PermitDetails';


type PageType =
  | 'admin-dashboard'
  | 'supervisor-dashboard'
  | 'approver-dashboard'
  | 'dashboard' // Keep for backwards compatibility/initial state
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
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh trigger

  useEffect(() => {
    const initializeAuth = async () => {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (userStr && token) {
        try {
          const localUser = JSON.parse(userStr);
          setCurrentUser(localUser);

          // Fetch latest details (including department_name, site_name etc) from server
          const response = await authAPI.getCurrentUser();
          if (response.success && response.data) {
            const updatedUser = {
              ...response.data,
              frontendRole: getHighestPriorityRole(response.data.role)
            };
            console.log('🔄 User data refreshed from server:', updatedUser.department_name);
            setCurrentUser(updatedUser);

            // Sync storage
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Failed to parse or refresh user data:', error);
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
      setCurrentPage('approver-dashboard'); // Ensure we switch to the correct dashboard
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

  // Determine user capabilities
  const roleString = currentUser.role || '';
  const hasAdminRole = roleString.toLowerCase().includes('admin');
  const hasSupervisorRole = roleString.toLowerCase().includes('supervisor') || roleString.toLowerCase().includes('requester');
  const hasApproverRole = roleString.toLowerCase().includes('approver');

  // Debug logging
  console.log('👤 User role string:', roleString);
  console.log('🔐 Role flags:', { hasAdminRole, hasSupervisorRole, hasApproverRole });

  // Map "dashboard" to the best available dashboard for this user
  const resolvedPage = currentPage === 'dashboard'
    ? (hasAdminRole ? 'admin-dashboard' : hasApproverRole ? 'approver-dashboard' : 'supervisor-dashboard')
    : currentPage;

  console.log('🔍 Current page (resolved):', resolvedPage);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        approverTab={approverTab}
      />

      <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Admin Pages */}
          {(resolvedPage === 'admin-dashboard' || ['site-management', 'user-management', 'all-permits', 'reports'].includes(resolvedPage)) && hasAdminRole && (
            <>
              {resolvedPage === 'admin-dashboard' && <AdminDashboard key={refreshKey} onNavigate={handleNavigate} />}
              {resolvedPage === 'site-management' && <SiteManagement onBack={() => handleNavigate('admin-dashboard')} />}
              {resolvedPage === 'user-management' && <UserManagement onBack={() => handleNavigate('admin-dashboard')} />}
              {resolvedPage === 'all-permits' && <AllPermits key={refreshKey} onNavigate={handleNavigate} />}
              {resolvedPage === 'reports' && <Reports onBack={() => handleNavigate('admin-dashboard')} />}
            </>
          )}

          {/* Supervisor Pages */}
          {(resolvedPage === 'supervisor-dashboard' || ['create-permit', 'worker-list'].includes(resolvedPage)) && hasSupervisorRole && (
            <>
              {resolvedPage === 'supervisor-dashboard' && (
                <SupervisorDashboard key={refreshKey} onNavigate={handleNavigate} />
              )}
              {resolvedPage === 'create-permit' && (
                <CreatePTW onBack={() => handleNavigate('supervisor-dashboard')} />
              )}
              {resolvedPage === 'worker-list' && (
                <WorkerList onBack={() => handleNavigate('supervisor-dashboard')} />
              )}
            </>
          )}

          {/* Approver Pages */}
          {(resolvedPage === 'approver-dashboard' || ['permit-edit', 'extension-approvals'].includes(resolvedPage)) && hasApproverRole && (
            <>
              {resolvedPage === 'approver-dashboard' && (
                <ApproverDashboard
                  key={refreshKey}
                  onNavigate={handleNavigate}
                  initialTab={approverTab}
                />
              )}
              {resolvedPage === 'permit-edit' && selectedPermitId && (
                <EditPTW
                  permitId={selectedPermitId}
                  onBack={() => handleNavigate('approver-dashboard')}
                  onSave={() => {
                    setRefreshKey(prev => prev + 1);
                    handleNavigate('approver-dashboard');
                  }}
                />
              )}
              {resolvedPage === 'extension-approvals' && (
                <ExtensionApprovalDashboard onNavigate={handleNavigate} />
              )}
            </>
          )}

          {/* Unified Permit Detail View - Renders once for any role */}
          {resolvedPage === 'permit-detail' && selectedPermitId && (
            <PermitDetails
              ptwId={selectedPermitId}
              onBack={() => {
                // Determine best back destination based on role
                if (hasAdminRole) handleNavigate('all-permits');
                else if (hasApproverRole) handleNavigate('approver-dashboard');
                else handleNavigate('supervisor-dashboard');
              }}
            />
          )}

          {/* Fallback: Show message if no dashboard is rendering */}
          {!hasAdminRole && !hasSupervisorRole && !hasApproverRole && (
            <div className="flex items-center justify-center min-h-screen p-6">
              <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 text-orange-600 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">No Dashboard Available</h2>
                <p className="mb-4 text-gray-600">
                  Your account role (<strong>{roleString || 'None'}</strong>) doesn't have access to any dashboard.
                </p>
                <p className="text-sm text-gray-500">
                  Please contact your administrator to assign you a proper role.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 mt-6 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
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