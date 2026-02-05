import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/questions" className="text-2xl font-bold text-gray-800 hover:text-primary-600 transition-colors">
            DevQ&A
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/users">
              <Button variant="ghost" size="sm">Users</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <span className="text-gray-600 hidden sm:inline">
                  Welcome, <span className="font-medium text-gray-800">{user?.username}</span>
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
