import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../ui';
import { Milk, Receipt, AlertCircle, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PortalDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newQuantity, setNewQuantity] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/portal/dashboard/${user.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setNewQuantity(json.todayDelivery?.delivered_quantity || json.customer.daily_milk_quantity);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!newQuantity || isNaN(newQuantity) || parseFloat(newQuantity) < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('http://localhost:5000/api/portal/update-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          date: new Date().toISOString().split('T')[0],
          quantity: parseFloat(newQuantity),
          session: user.shift
        })
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      toast.success("Quantity updated successfully! Admin notified.");
      fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8">Loading your dashboard...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user.full_name}! 👋</h1>
          <p className="text-gray-500">Welcome to your milk delivery dashboard.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Current Balance</p>
          <p className="text-xl font-black text-indigo-700">₹{data?.totalDue || 0}</p>
        </div>
      </header>

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
              <p className="font-bold">{data?.customer.daily_milk_quantity}L / Day</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Shift</p>
              <p className="font-bold capitalize">{data?.customer.shift}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Customer Type</p>
              <p className="font-bold capitalize">{data?.customer.customer_type}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Wallet Credit</p>
              <p className="font-bold text-green-400">₹{data?.customer.credit_balance || 0}</p>
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
        
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Last Bill</p>
            <p className="font-bold text-gray-700">Check History</p>
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
