import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../ui';
import { Calendar, Milk, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PortalDeliveries({ user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/portal/deliveries/${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeliveries(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'leave':     return 'bg-red-100 text-red-700';
      case 'extra':     return 'bg-blue-100 text-blue-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8">Loading delivery logs...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
        <p className="text-gray-500">View your milk delivery records for the last 30 days.</p>
      </header>

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
                  <p className="text-sm font-bold text-gray-900">{delivery.delivered_quantity}L</p>
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
