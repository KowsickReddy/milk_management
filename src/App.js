import React, { useState, Suspense, lazy } from 'react';
import './index.css';

import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';
import { Milk, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button, Card } from './ui';
import { toast } from 'react-hot-toast';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Customers  = lazy(() => import('./pages/Customers'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Billing    = lazy(() => import('./pages/Billing'));
const Reports    = lazy(() => import('./pages/Reports'));

// ── Loading fallback ───────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// ── Error boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Page error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Login Screen ───────────────────────────────────────────────────────────
const DEMO_CREDENTIALS = { username: 'admin', pin: '1234' };

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin,      setPin]      = useState('');
  const [showPin,  setShowPin]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) {
      toast.error('Enter username and PIN');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success(`Welcome back, ${data.full_name || data.username}! 👋`);
      onLogin(data);
    } catch (err) {
      // Fallback to demo credentials when backend not available
      if (username === DEMO_CREDENTIALS.username && pin === DEMO_CREDENTIALS.pin) {
        toast.success('Welcome back, Admin! 👋');
        onLogin({ username, role: 'admin', full_name: 'Admin' });
      } else {
        toast.error(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b48c8 100%)' }}>
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-sm relative">
        {/* Glass card */}
        <div className="bg-white/15 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 shadow-2xl">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-xl">
              <Milk className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Dairy Manager</h1>
            <p className="text-white/60 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/50" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3.5 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium backdrop-blur-sm"
              />
            </div>

            {/* PIN */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3.5 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg mt-2 disabled:opacity-70"
            >
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-6">
            Default: admin / 1234
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
function AppContent() {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const { loading } = useApp();

  const handleLogin  = () => setIsLoggedIn(true);
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };

  const renderPage = () => {
    const props = { onNavigate: setActiveTab };
    switch (activeTab) {
      case 'dashboard':  return <Dashboard  {...props} />;
      case 'customers':  return <Customers  {...props} />;
      case 'deliveries': return <Deliveries {...props} />;
      case 'billing':    return <Billing    {...props} />;
      case 'reports':    return <Reports    {...props} />;
      default:           return <Dashboard  {...props} />;
    }
  };

  if (loading) return <LoadingFallback />;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={true} onClose={() => {}} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar (drawer) */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      {/* Main content */}
      <div className="md:ml-64">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 md:hidden z-50 w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center border border-gray-100"
        onClick={() => setSidebarOpen(true)}
      >
        <div className="space-y-1.5 w-5">
          <div className="h-0.5 bg-gray-600 rounded" />
          <div className="h-0.5 bg-gray-600 rounded w-3/4" />
          <div className="h-0.5 bg-gray-600 rounded" />
        </div>
      </button>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}