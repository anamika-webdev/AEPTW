import { useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SiteManagement } from './components/admin/SiteManagement';
import { UserManagement } from './components/admin/UserManagement';
import { PTWAllPermits } from './components/admin/PTWAllPermits';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { WorkerList } from './components/supervisor/WorkerList';
import { CreatePTW } from './components/supervisor/CreatePTW';
import { SupervisorPTWDetails } from './components/supervisor/SupervisorPTWDetails';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { WorkerPTWDetails } from './components/worker/WorkerPTWDetails';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

export type UserRole = 'admin' | 'supervisor' | 'worker';
export type CurrentPage = 
  | 'admin-dashboard' 
  | 'site-management' 
  | 'user-management' 
  | 'ptw-all-permits'
  | 'supervisor-dashboard'
  | 'worker-list'
  | 'create-ptw'
  | 'supervisor-ptw-details'
  | 'worker-dashboard'
  | 'worker-ptw-details';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState<CurrentPage>('admin-dashboard');
  const [selectedPTWId, setSelectedPTWId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePTWSelect = (ptwId: string) => {
    setSelectedPTWId(ptwId);
    if (currentRole === 'admin' || currentRole === 'supervisor') {
      setCurrentPage('supervisor-ptw-details');
    } else if (currentRole === 'worker') {
      setCurrentPage('worker-ptw-details');
    }
  };

  // Role selection screen
  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <img src="logo.jpg" alt="EPTW logo" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="text-slate-900">EPTW System</h1>
            </div>
            <p className="text-slate-600 px-4">Electronic Permit-To-Work Management System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4">
            {/* Admin Role */}
            <button
              onClick={() => {
                setCurrentRole('admin');
                setCurrentPage('admin-dashboard');
              }}
              className="bg-white p-6 md:p-8 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <span className="text-blue-600 group-hover:text-white transition-colors text-2xl"></span>
              </div>
              <h3 className="text-slate-900 mb-2">Admin</h3>
              <p className="text-slate-600 text-sm">Full system management and oversight</p>
            </button>

            {/* Supervisor Role */}
            <button
              onClick={() => {
                setCurrentRole('supervisor');
                setCurrentPage('supervisor-dashboard');
              }}
              className="bg-white p-6 md:p-8 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <span className="text-green-600 group-hover:text-white transition-colors text-2xl"></span>
              </div>
              <h3 className="text-slate-900 mb-2">EPTW</h3>
              <p className="text-slate-600 text-sm">Create and manage PTW permits</p>
            </button>

            {/* Worker Role */}
            {/*<button
              onClick={() => {
                setCurrentRole('worker');
                setCurrentPage('worker-dashboard');
              }}
              className="bg-white p-6 md:p-8 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 transition-colors">
                <span className="text-orange-600 group-hover:text-white transition-colors text-2xl"></span>
              </div>
              <h3 className="text-slate-900 mb-2">Worker</h3>
              <p className="text-slate-600 text-sm">View and sign assigned permits</p>
            </button>*/}
          </div>
        </div>
      </div>
    );
  }

  // Main application with sidebar
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        currentRole={currentRole} 
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
        }}
        onLogout={() => setCurrentRole(null)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="lg:ml-64">
        <Header 
          currentRole={currentRole}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        <main className="p-4 md:p-6 lg:p-8">
          {/* Admin Pages */}
          {currentRole === 'admin' && currentPage === 'admin-dashboard' && <AdminDashboard onNavigate={setCurrentPage} onPTWSelect={handlePTWSelect} />}
          {currentRole === 'admin' && currentPage === 'site-management' && <SiteManagement />}
          {currentRole === 'admin' && currentPage === 'user-management' && <UserManagement />}
          {currentRole === 'admin' && currentPage === 'ptw-all-permits' && <PTWAllPermits onPTWSelect={handlePTWSelect} />}
          {currentRole === 'admin' && currentPage === 'supervisor-ptw-details' && selectedPTWId && (
            <SupervisorPTWDetails ptwId={selectedPTWId} onBack={() => setCurrentPage('ptw-all-permits')} />
          )}

          {/* Supervisor Pages */}
          {currentRole === 'supervisor' && currentPage === 'supervisor-dashboard' && <SupervisorDashboard onNavigate={setCurrentPage} onPTWSelect={handlePTWSelect} />}
          {currentRole === 'supervisor' && currentPage === 'worker-list' && <WorkerList onNavigate={setCurrentPage} />}
          {currentRole === 'supervisor' && currentPage === 'create-ptw' && <CreatePTW onBack={() => setCurrentPage('supervisor-dashboard')} />}
          {currentRole === 'supervisor' && currentPage === 'supervisor-ptw-details' && selectedPTWId && (
            <SupervisorPTWDetails ptwId={selectedPTWId} onBack={() => setCurrentPage('supervisor-dashboard')} />
          )}

          {/* Worker Pages */}
          {currentRole === 'worker' && currentPage === 'worker-dashboard' && <WorkerDashboard onPTWSelect={handlePTWSelect} />}
          {currentRole === 'worker' && currentPage === 'worker-ptw-details' && selectedPTWId && (
            <WorkerPTWDetails ptwId={selectedPTWId} onBack={() => setCurrentPage('worker-dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}