import React, { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';

import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Milk, Loader2, Lock, User, Eye, EyeOff, Phone, ArrowRight, Fingerprint,
  Sun, Moon, LogOut, Menu 
} from 'lucide-react';
import { Button, Card } from './ui';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { startAuthentication } from '@simplewebauthn/browser';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Customers  = lazy(() => import('./pages/Customers'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Billing    = lazy(() => import('./pages/Billing'));
const Reports    = lazy(() => import('./pages/Reports'));
const AccessLogs = lazy(() => import('./pages/AccessLogs'));
const FarmManagement = lazy(() => import('./pages/FarmManagement'));
const AccessManagement = lazy(() => import('./pages/AccessManagement'));
const ManageLeaves     = lazy(() => import('./pages/ManageLeaves'));
const Expenses         = lazy(() => import('./pages/Expenses'));
const MilkCalculator   = lazy(() => import('./pages/MilkCalculator'));
const About            = lazy(() => import('./pages/About'));
const Notes            = lazy(() => import('./pages/Notes'));
const AdminCalendar    = lazy(() => import('./pages/AdminCalendar'));

// Customer Portal Pages
const PortalDashboard  = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalDeliveries = lazy(() => import('./pages/portal/PortalDeliveries'));
const PortalBills      = lazy(() => import('./pages/portal/PortalBills'));
const PortalSupport    = lazy(() => import('./pages/portal/PortalSupport'));
const PortalCalendar   = lazy(() => import('./pages/portal/PortalCalendar'));

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
function LoginScreen({ onLogin }) {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'customer'
  const [identifier, setIdentifier] = useState(''); // username or phone
  const [pin,        setPin]        = useState('');
  const [showPin,  setShowPin]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const handleFingerprintLogin = async () => {
    setBioLoading(true);
    try {
      const beginRes = await fetch(`${API_BASE_URL}/api/auth/webauthn/login/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier.trim() }),
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginData.error || 'Biometric login failed');

      const credential = await startAuthentication(beginData);
      const completeRes = await fetch(`${API_BASE_URL}/api/auth/webauthn/login/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: beginData.userId, credential }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error || 'Biometric verification failed');

      toast.success(`Welcome back, ${completeData.full_name || completeData.username}! 👋`);
      onLogin(completeData);
    } catch (err) {
      if (err.name !== 'UserAbortedError' && err.name !== 'NotAllowedError') {
        toast.error(err.message || 'Fingerprint login failed');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !pin.trim()) {
      toast.error(loginType === 'admin' ? 'Enter username and PIN' : 'Enter phone and PIN');
      return;
    }
    setLoading(true);
    try {
      const endpoint = loginType === 'admin' 
        ? `${API_BASE_URL}/api/users/login` 
        : `${API_BASE_URL}/api/customers/login`;
      
      const body = loginType === 'admin'
        ? { username: identifier.trim(), pin: pin.trim() }
        : { phone: identifier.trim(), pin: pin.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success(`Welcome back, ${data.full_name || data.username}! 👋`);
      onLogin(data);
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo/Branding */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dairy Manager</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Streamline your delivery business</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 transition-colors">
          {/* Segmented Control Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
            <button 
              onClick={() => { setLoginType('admin'); setIdentifier(''); setPin(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'admin' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Staff Login
            </button>
            <button 
              onClick={() => { setLoginType('customer'); setIdentifier(''); setPin(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'customer' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Customer Portal
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                {loginType === 'admin' ? 'Username' : 'Registered Phone'}
              </label>
              <div className="relative">
                {loginType === 'admin' ? 
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" /> : 
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                }
                <input
                  type={loginType === 'admin' ? 'text' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={loginType === 'admin' ? 'Enter username' : '10-digit mobile'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Security PIN</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {loginType === 'admin' && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleFingerprintLogin}
                  disabled={bioLoading || !identifier.trim()}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {bioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Fingerprint className="w-4 h-4" />
                  )}
                  {bioLoading ? 'Authenticating...' : 'Fingerprint Login'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 text-center border-t border-slate-50 dark:border-slate-800 pt-6">
            {loginType === 'admin' ? (
              <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                Admin credentials required for staff access.
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium leading-relaxed">
                Enter the mobile number where you receive your deliveries to access your dashboard.
              </p>
            )}
            {loginType === 'customer' && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    const phone = prompt('Enter your registered phone number to request a PIN reset:');
                    if (!phone) return;
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/forgot-pin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone }),
                      });
                      const data = await res.json();
                      toast.success('If registered, a reset request was sent to the admin.');
                    } catch (err) {
                      toast.error(err.message);
                    }
                  }}
                  className="text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
                >
                  Forgot PIN? Request Reset
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          Secure Cloud Powered System
        </p>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
function AppContent() {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [user,         setUser]         = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from storage", e);
      return null;
    }
  });
  const { loading } = useApp();

  // Breadcrumb label - defined early for hooks consistency (used by useEffect for page title)
  const pageLabels = {
    dashboard: 'Dashboard', customers: 'Customers', deliveries: 'Deliveries',
    billing: 'Billing', leaves: 'Manage Leaves', expenses: 'Expenses',
    'farm-mgmt': 'Farm Management', 'access-mgmt': 'Portal Access',
    reports: 'Reports', 'access-logs': 'Access Logs', calculator: 'Calculator',
    about: 'About', notes: 'Notes', 'admin-calendar': 'Delivery Calendar',
    bills: 'My Bills', support: 'Support', calendar: 'Calendar',
  };
  const currentPage = pageLabels[activeTab] || 'Dashboard';

  // Theme toggle with OS preference auto-detection
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    // Auto-detect OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic page title
  useEffect(() => {
    const appName = 'Dairy MS';
    document.title = `${currentPage} · ${appName}`;
  }, [currentPage]);

  const handleLogin  = (userData) => {
    if (userData.token) localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setActiveTab('dashboard');
  };
  
  const handleLogout = () => { 
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null); 
  };

  const renderPage = () => {
    const props = { onNavigate: setActiveTab, user };
    
    // Admin/Worker Pages
    if (user?.role === 'admin' || user?.role === 'worker') {
      switch (activeTab) {
        case 'dashboard':  return <Dashboard  {...props} />;
        case 'customers':  return <Customers  {...props} />;
        case 'deliveries': return <Deliveries {...props} />;
        case 'billing':    return <Billing    {...props} />;
        case 'reports':    return <Reports    {...props} />;
        case 'access-logs':return <AccessLogs {...props} />;
        case 'expenses':   return <Expenses   {...props} />;
        case 'calculator': return <MilkCalculator {...props} />;
        case 'farm-mgmt':  return <FarmManagement {...props} />;
        case 'access-mgmt':return <AccessManagement {...props} />;
        case 'leaves':     return <ManageLeaves     {...props} />;
        case 'about':      return <About        {...props} />;
        case 'notes':      return <Notes        {...props} />;
        case 'admin-calendar': return <AdminCalendar {...props} />;
        default:           return <Dashboard  {...props} />;
      }
    }
    
    // Customer Portal Pages
    if (user?.role === 'customer') {
      switch (activeTab) {
        case 'dashboard':  return <PortalDashboard  {...props} />;
        case 'deliveries': return <PortalDeliveries {...props} />;
        case 'bills':      return <PortalBills      {...props} />;
        case 'support':    return <PortalSupport    {...props} />;
        case 'calendar':   return <PortalCalendar   {...props} />;
        default:           return <PortalDashboard  {...props} />;
      }
    }

    return <LoadingFallback />;
  };

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className={cn('min-h-screen transition-colors duration-300', darkMode ? 'dark bg-slate-900' : 'bg-slate-50')}>
      {/* Single Sidebar — handles desktop (collapsible) + mobile (drawer with backdrop) internally */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} user={user} />

      {/* Top Navigation Bar */}
      <header className={cn(
        'sticky top-0 z-30 transition-colors duration-300',
        darkMode ? 'bg-slate-900/80' : 'bg-white/80',
        'backdrop-blur-xl border-b',
        darkMode ? 'border-slate-800' : 'border-slate-200/60',
        'md:ml-64'
      )}>
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          {/* Left: Mobile hamburger + Page title */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className={cn(
                'text-lg md:text-xl font-bold tracking-tight',
                darkMode ? 'text-white' : 'text-slate-900'
              )}>
                {currentPage}
              </h1>
              <p className={cn(
                'text-xs font-medium',
                darkMode ? 'text-slate-400' : 'text-slate-500'
              )}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                darkMode
                  ? 'text-amber-400 hover:bg-slate-800'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                darkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-rose-400'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-rose-600'
              )}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="md:ml-64 pt-0">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="p-4 md:p-6 pb-24 md:pb-6"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} user={user} />

      <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { borderRadius: '16px', padding: '12px 20px', fontSize: '14px', fontWeight: 500 } }} />
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
