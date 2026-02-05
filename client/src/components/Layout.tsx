import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Floating orbs */}
      <div className="editorial-orb orb-one" aria-hidden="true" />
      <div className="editorial-orb orb-two" aria-hidden="true" />
      <div className="editorial-orb orb-three" aria-hidden="true" />

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/questions" className="flex items-center gap-2 group">
            <div className="bg-primary-500 p-1.5 rounded-lg shadow-lg shadow-primary-500/20">
              <span className="material-icons-outlined text-white text-xl">code</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-sky-600 editorial-title">
              DevQ&A
            </span>
          </Link>

          {/* Nav + Auth */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link
                to="/questions"
                className={`pb-1 transition-colors ${
                  isActive('/questions')
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                Feed
              </Link>
              <Link
                to="/users"
                className={`pb-1 transition-colors ${
                  isActive('/users')
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                Users
              </Link>
            </nav>

            <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block" />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="glass flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/40">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-primary-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline text-gray-700">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-white/30 transition-all text-gray-500 hover:text-gray-700"
                  aria-label="Logout"
                >
                  <span className="material-icons-outlined text-xl">logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {children}
      </main>

      {/* Mobile spacer for bottom nav */}
      <div className="h-20 lg:hidden" />

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20 px-6 h-16 flex items-center justify-around z-50">
        <Link to="/questions" className={isActive('/questions') ? 'text-primary-500' : 'text-slate-400'}>
          <span className="material-icons-outlined">explore</span>
        </Link>
        <Link to="/users" className={isActive('/users') ? 'text-primary-500' : 'text-slate-400'}>
          <span className="material-icons-outlined">people</span>
        </Link>
        {isAuthenticated && (
          <Link
            to="/questions/ask"
            className="w-12 h-12 -mt-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30"
          >
            <span className="material-icons-outlined">add</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Layout;
