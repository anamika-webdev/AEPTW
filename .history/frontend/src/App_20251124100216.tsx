import { useState, useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import { User } from './types/auth.types';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';

// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import CreatePermit from './pages/supervisor/CreatePermit';
import WorkerList from './pages/supervisor/WorkerList';
import PermitDetails from './pages/supervisor/PermitDetails';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPTWId, setSelectedPTWId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Set default page based on role
        if (user.role === 'Admin') {
          setCurrentPage('admin-dashboard');
        } else if (user.role === 'Supervisor') {
          setCurrentPage('supervisor-dashboard');
        } else if (user.role === 'Worker') {
          setCurrentPage('worker-dashboard');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Set default page based on role
    if (user.role === 'Admin') {
      setCurrentPage('admin-dashboard');
    } else if (user.role === 'Supervisor') {
      setCurrentPage('supervisor-dashboard');
    } else if (user.role === 'Worker') {
      setCurrentPage('worker-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handlePTWSelect = (ptwId: number) => {
    setSelectedPTWId(ptwId);
    if (currentUser?.role === 'Admin') {
      setCurrentPage('admin-ptw-details');
    } else if (currentUser?.role === 'Supervisor') {
      setCurrentPage('supervisor-ptw-details');
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Main application
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSelectedPTWId(null);
        }}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="lg:ml-64">
        <Header
          currentUser={currentUser}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
        />

        <main className="p-4 md:p-6 lg:p-8">
          {/* Admin Routes */}
          {currentUser.role === 'Admin' && (
            <>
              {currentPage === 'admin-dashboard' && (
                <AdminDashboard onNavigate={setCurrentPage} onPTWSelect={handlePTWSelect} />
              )}
              {currentPage === 'site-management' && <SiteManagement />}
              {currentPage === 'user-management' && <UserManagement />}
              {currentPage === 'all-permits' && <AllPermits onPTWSelect={handlePTWSelect} />}
              {currentPage === 'admin-ptw-details' && selectedPTWId && (
                <PermitDetails 
                  ptwId={selectedPTWId} 
                  onBack={() => setCurrentPage('all-permits')} 
                />
              )}
            </>
          )}

          {/* Supervisor Routes */}
          {currentUser.role === 'Supervisor' && (
            <>
              {currentPage === 'supervisor-dashboard' && (
                <SupervisorDashboard onNavigate={setCurrentPage} onPTWSelect={handlePTWSelect} />
              )}
              {currentPage === 'create-permit' && (
                <CreatePermit onBack={() => setCurrentPage('supervisor-dashboard')} />
              )}
              {currentPage === 'worker-list' && <WorkerList onNavigate={setCurrentPage} />}
              {currentPage === 'supervisor-ptw-details' && selectedPTWId && (
                <PermitDetails 
                  ptwId={selectedPTWId} 
                  onBack={() => setCurrentPage('supervisor-dashboard')} 
                />
              )}
            </>
          )}

          {/* Worker Routes */}
          {currentUser.role === 'Worker' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome, {currentUser.full_name}!
              </h2>
              <p className="text-slate-600">Worker dashboard coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}