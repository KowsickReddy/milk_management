import React, { useState, Suspense, lazy } from 'react';
import './index.css';

import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';
import { Milk, Loader2, Lock, User, Eye, EyeOff, Phone, ArrowRight } from 'lucide-react';
import { Button, Card } from './ui';
import { toast } from 'react-hot-toast';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Customers  = lazy(() => import('./pages/Customers'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Billing    = lazy(() => import('./pages/Billing'));
const Reports    = lazy(() => import('./pages/Reports'));
const AccessLogs = lazy(() => import('./pages/AccessLogs'));
const FarmManagement = lazy(() => import('./pages/FarmManagement'));
const AccessManagement = lazy(() => import('./pages/AccessManagement'));
const ManageLeaves     = lazy(() => import('./pages/ManageLeaves'));

// Customer Portal Pages
const PortalDashboard  = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalDeliveries = lazy(() => import('./pages/portal/PortalDeliveries'));
const PortalBills      = lazy(() => import('./pages/portal/PortalBills'));
const PortalSupport    = lazy(() => import('./pages/portal/PortalSupport'));

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
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'customer'
  const [identifier, setIdentifier] = useState(''); // username or phone
  const [pin,        setPin]        = useState('');
  const [showPin,  setShowPin]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !pin.trim()) {
      toast.error(loginType === 'admin' ? 'Enter username and PIN' : 'Enter phone and PIN');
      return;
    }
    setLoading(true);
    try {
      const endpoint = loginType === 'admin' 
        ? 'http://localhost:5000/api/users/login' 
        : 'http://localhost:5000/api/customers/login';
      
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
      // Fallback for admin demo
      if (loginType === 'admin' && identifier === DEMO_CREDENTIALS.username && pin === DEMO_CREDENTIALS.pin) {
        toast.success('Welcome back, Admin! 👋');
        onLogin({ username: identifier, role: 'admin', full_name: 'Admin' });
      } else {
        toast.error(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo/Branding */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dairy Manager</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Streamline your delivery business</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
          {/* Segmented Control Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
              onClick={() => { setLoginType('admin'); setIdentifier(''); setPin(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Staff Login
            </button>
            <button 
              onClick={() => { setLoginType('customer'); setIdentifier(''); setPin(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'customer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Customer Portal
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                {loginType === 'admin' ? 'Username' : 'Registered Phone'}
              </label>
              <div className="relative">
                {loginType === 'admin' ? 
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" /> : 
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                }
                <input
                  type={loginType === 'admin' ? 'text' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={loginType === 'admin' ? 'Enter username' : '10-digit mobile'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Security PIN</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
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
          </form>

          <div className="mt-8 text-center border-t border-slate-50 pt-6">
            {loginType === 'admin' ? (
              <p className="text-slate-400 text-[11px] font-medium">
                Admin credentials required for staff access.
              </p>
            ) : (
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                Enter the mobile number where you receive your deliveries to access your dashboard.
              </p>
            )}
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
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

  const handleLogin  = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
    setUser(userData);
    setActiveTab('dashboard');
  };
  
  const handleLogout = () => { 
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null); 
    setActiveTab('dashboard'); 
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
        case 'farm-mgmt':  return <FarmManagement {...props} />;
        case 'access-mgmt':return <AccessManagement {...props} />;
        case 'leaves':     return <ManageLeaves     {...props} />;
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
        default:           return <PortalDashboard  {...props} />;
      }
    }

    return <LoadingFallback />;
  };

  if (loading) return <LoadingFallback />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={true} onClose={() => {}} onLogout={handleLogout} user={user} />
      </div>

      {/* Mobile sidebar (drawer) */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} user={user} />

      {/* Main content */}
      <div className="md:ml-64">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} user={user} />

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