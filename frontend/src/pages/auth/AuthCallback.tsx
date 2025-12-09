import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// User interface
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
  department?: string;
  auth_provider?: 'local' | 'google';
}

interface OAuthCallbackProps {
  onLogin: (user: User) => void;
}

// Role mapping function
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  if (dbRole === 'Admin') {
    return 'Admin';
  }
  return 'Supervisor';
}

const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = () => {
      try {
        // Get token and user from URL parameters
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (!token || !userParam) {
          console.error('Missing token or user data');
          navigate('/login?error=missing_data');
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Map database role to frontend role
        const mappedUser: User = {
          ...user,
          frontendRole: mapDatabaseRoleToFrontend(user.role)
        };

        console.log('OAuth login successful:', {
          databaseRole: user.role,
          frontendRole: mappedUser.frontendRole,
          authProvider: 'google'
        });

        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(mappedUser));

        // Call login handler
        onLogin(mappedUser);

      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=processing_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, onLogin, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-b-2 border-orange-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we authenticate you</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
