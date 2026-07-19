import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../ui';
import { Milk, Receipt, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function PortalDashboard({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const json = await api.portal.getDashboard(user.id);
        if (cancelled) return;
        setData(json);
        setNewQuantity(json.todayDelivery?.delivered_quantity || json.customer?.daily_milk_quantity || 0);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id, retry]);

  const handleUpdateQuantity = async () => {
    if (!newQuantity || isNaN(newQuantity) || parseFloat(newQuantity) < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setUpdating(true);
    try {
      await api.portal.updateQuantity({
        customer_id: user.id,
        date: new Date().toISOString().split('T')[0],
        quantity: parseFloat(newQuantity),
        session: user.shift
      });
      toast.success("Quantity updated successfully! Admin notified.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="max-w-md mx-auto p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <p className="font-bold text-red-600">Failed to load dashboard</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{error}</p>
        <Button onClick={() => { setError(null); setRetry(r => r + 1); }}>Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Hello, {user.name || user.full_name || 'Customer'}!</h1>
          <p className="text-sm text-slate-500">Welcome to your milk delivery dashboard.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Current Balance</p>
          <p className="text-xl font-black text-indigo-700">₹{data?.totalDue || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-indigo-50">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Today's Delivery</h2>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Quantity (Liters)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={newQuantity} 
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="Ex: 1.5"
                />
              </div>
              <Button onClick={handleUpdateQuantity} disabled={updating} className="h-[46px]">
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 italic font-medium">* Changing this will automatically update today's delivery and notify the admin.</p>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl shadow-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold">Subscription Info</h2>
              <p className="text-sm text-white/60">Your regular plan details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Base Plan</p>
              <p className="font-bold">{data?.customer?.daily_milk_quantity || 0}L / Day</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Shift</p>
              <p className="font-bold capitalize">{data?.customer?.shift || 'N/A'}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Customer Type</p>
              <p className="font-bold capitalize">{data?.customer?.customer_type || 'N/A'}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Wallet Credit</p>
              <p className="font-bold text-green-400">₹{data?.customer?.credit_balance || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Status</p>
            <p className="font-bold text-gray-700 capitalize">{data?.todayDelivery?.status || 'Pending'}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition-all" onClick={() => onNavigate?.('bills')}>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Last Bill</p>
            <p className="font-bold text-gray-700">View Bills →</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-red-100 bg-red-50/30 cursor-pointer hover:bg-red-50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-red-400 font-bold uppercase">Need Help?</p>
            <p className="font-bold text-red-700">Raise Complaint</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
