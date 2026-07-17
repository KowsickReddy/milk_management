import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../ui';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function PortalDeliveries({ user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.portal.getDeliveries(user.id);
        if (cancelled) return;
        setDeliveries(Array.isArray(data) ? data : data?.deliveries || []);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'leave':     return 'bg-red-100 text-red-700';
      case 'extra':     return 'bg-blue-100 text-blue-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading delivery logs...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="max-w-md mx-auto p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <p className="font-bold text-red-600">Failed to load deliveries</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{error}</p>
        <Button onClick={() => { setError(null); setRetry(r => r + 1); }}>Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Delivery History</h1>
        <p className="text-sm text-slate-500">View your milk delivery records for the last 30 days.</p>
      </div>

      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <Card className="p-12 text-center text-gray-400">
            No delivery records found.
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="p-4 flex items-center justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {new Date(delivery.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 capitalize">
                    <Clock className="w-3 h-3" /> {delivery.delivery_shift || 'Morning'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{delivery.delivered_quantity || 0}L</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Quantity</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}