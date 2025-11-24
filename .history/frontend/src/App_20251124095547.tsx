import { useState, useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import { User } from './types/auth.types';

// Import your dashboard pages (you'll need to create these based on your existing code)
// import AdminDashboard from './pages/admin/AdminDashboard';
// import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
// import WorkerDashboard from './pages/worker/WorkerDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
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

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
        onNavigate={setCurrentPage}
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
          {/* Render pages based on currentPage and role */}
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome, {currentUser.full_name}!
            </h2>
            <p className="text-slate-600">
              Role: {currentUser.role} | Page: {currentPage}
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Dashboard pages will be rendered here based on your role
            </p>
          </div>

          {/* Add your actual dashboard components here */}
          {/* {currentUser.role === 'Admin' && currentPage === 'admin-dashboard' && <AdminDashboard />} */}
          {/* {currentUser.role === 'Supervisor' && currentPage === 'supervisor-dashboard' && <SupervisorDashboard />} */}
          {/* {currentUser.role === 'Worker' && currentPage === 'worker-dashboard' && <WorkerDashboard />} */}
        </main>
      </div>
    </div>
  );
}