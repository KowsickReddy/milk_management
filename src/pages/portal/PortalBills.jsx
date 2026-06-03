import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../ui';
import { Receipt, Calendar, CreditCard, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PortalBills({ user }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/portal/bills/${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBills(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    return new Date(2000, monthNum - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) return <div className="p-8">Loading your bills...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bills</h1>
          <p className="text-gray-500">Track your monthly invoices and payments.</p>
        </div>
      </header>

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
                    <p className="text-lg font-black text-gray-900">₹{bill.final_amount}</p>
                    <p className={`text-[10px] font-bold uppercase ${bill.paid ? 'text-green-500' : 'text-amber-500'}`}>
                      {bill.paid ? 'Paid' : `Pending: ₹${bill.balance}`}
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
