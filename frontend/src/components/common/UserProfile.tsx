// frontend/src/components/common/UserProfile.tsx
import { User, Mail, Building2, Shield, Calendar, Phone, Briefcase, MapPin } from 'lucide-react';

interface UserData {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
  department?: string;
  department_name?: string;
  job_role?: string;
  phone?: string;
  site_name?: string;
  auth_provider?: 'local' | 'google';
  created_at?: string;
}

interface UserProfileProps {
  user: UserData;
  variant?: 'card' | 'inline';
}

export default function UserProfile({ user, variant = 'card' }: UserProfileProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Approver_Safety':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Approver_AreaManager':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Requester':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAuthProviderBadge = (provider?: string) => {
    if (provider === 'google') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-full">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          SSO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
        <Shield className="w-3 h-3 mr-1" />
        Local
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
          <span className="text-lg font-bold">
            {user.full_name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header with gradient background */}
      <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-600"></div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex justify-center -mt-12">
          <div className="p-1 bg-white rounded-full">
            <div className="flex items-center justify-center w-24 h-24 text-3xl font-bold text-white rounded-full shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
              {user.full_name?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>

          {/* Role and Auth Provider Badges */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
            {getAuthProviderBadge(user.auth_provider)}
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
            <User className="flex-shrink-0 w-5 h-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Login ID</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{user.login_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
            <Mail className="flex-shrink-0 w-5 h-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
            <Shield className="flex-shrink-0 w-5 h-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Portal Access</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.frontendRole === 'Admin' ? 'Administrator' : 'Supervisor'}
              </p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
              <Phone className="flex-shrink-0 w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{user.phone}</p>
              </div>
            </div>
          )}

          {(user.department_name || user.department) && (
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
              <Building2 className="flex-shrink-0 w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.department_name && user.department_name !== user.department?.toString()
                    ? user.department_name
                    : (user.department || 'N/A')}
                </p>
              </div>
            </div>
          )}

          {user.job_role && (
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
              <Briefcase className="flex-shrink-0 w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Job Role</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{user.job_role}</p>
              </div>
            </div>
          )}

          {user.site_name && (
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
              <MapPin className="flex-shrink-0 w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Primary Site</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{user.site_name}</p>
              </div>
            </div>
          )}

          {user.created_at && (
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
              <Calendar className="flex-shrink-0 w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}