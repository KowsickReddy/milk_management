import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../ui';
import { Receipt, CreditCard, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMonthName } from '../../lib/utils';
import api from '../../services/api';

export default function PortalBills({ user }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.portal.getBills(user.id);
        if (cancelled) return;
        setBills(Array.isArray(data) ? data : data?.bills || []);
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

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading bills...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="max-w-md mx-auto p-8 text-center">
        <Receipt className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <p className="font-bold text-red-600">Failed to load bills</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{error}</p>
        <Button onClick={() => { setError(null); setRetry(r => r + 1); }}>Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">My Bills</h1>
        <p className="text-sm text-slate-500">Track your monthly invoices and payments.</p>
      </div>

      <div className="space-y-4">
        {bills.length === 0 ? (
          <Card className="p-12 text-center text-gray-400">
            No bills have been generated yet.
          </Card>
        ) : (
          bills.map((bill) => (
            <Card key={bill.id} className="overflow-hidden border-2 border-slate-50">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bill.paid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{getMonthName(bill.bill_month)} {bill.bill_year}</h3>
                    <p className="text-xs text-gray-500 font-medium">{bill.total_quantity}L Total Milk Delivered</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">₹{bill.final_amount ?? bill.total_amount ?? 0}</p>
                    <p className={`text-[10px] font-bold uppercase ${bill.paid ? 'text-green-500' : 'text-amber-500'}`}>
                      {bill.paid ? 'Paid' : `Pending: ₹${bill.balance ?? 0}`}
                    </p>
                  </div>
                  <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {!bill.paid && (
                <div className="bg-amber-50 px-6 py-2 border-t border-amber-100 flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-amber-600" />
                  <p className="text-[10px] text-amber-700 font-bold uppercase">Please clear your dues with the delivery person.</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}