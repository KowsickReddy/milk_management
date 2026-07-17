import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, Calendar, Check, X, RefreshCw, ChevronDown, ChevronUp,
  Wallet, CreditCard, Banknote, TrendingUp, Clock, CheckCircle2,
  Share2, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { cn, formatCurrency, getMonthName, getInitials } from '../lib/utils';
import { Card, Button, Input, Select, SearchInput, ConfirmModal } from '../ui';


// ── Payment progress bar ─────────────────────────────────────────────────
function PaymentProgress({ paid, total, grossAmount }) {
  // Bill paid entirely via wallet credit (final_amount = 0)
  const walletPaid = grossAmount > 0 && total === 0;

  if (walletPaid) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-purple-600 font-semibold flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> Fully Paid via Wallet Credit
          </span>
          <span className="font-semibold text-emerald-600">{formatCurrency(grossAmount)}</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill progress-bar-green" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const color =
    pct >= 100 ? 'progress-bar-green' :
    pct >= 60  ? 'progress-bar-blue'  :
    pct >= 30  ? 'progress-bar-amber' : 'progress-bar-red';

  const filled = Math.max(0, Math.min(pct, 100));
  const blocks = Math.round(filled / 10);
  const blockBar = '\u2588'.repeat(blocks) + '\u2591'.repeat(10 - blocks);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500 font-mono tracking-wide">[{blockBar}] {pct}% Paid</span>
        <span className={cn('font-semibold', pct >= 100 ? 'text-emerald-600' : 'text-amber-600')}>
          {formatCurrency(paid)} / {formatCurrency(total)}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className={cn('progress-bar-fill', color)}
          style={{ width: `${filled}%` }}
        />
      </div>
    </div>
  );
}

// ── Payment history ledger ───────────────────────────────────────────────
function PaymentLedger({ billId }) {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'bill', billId],
    queryFn: () => api.payments.getByBill(billId),
    enabled: !!billId,
  });

  if (isLoading) return <div className="skeleton h-10 mt-2" />;
  if (!payments.length) return (
    <p className="text-xs text-gray-400 mt-2 text-center py-2">No payments recorded yet</p>
  );

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment History</p>
      <div className="space-y-1.5">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              {p.payment_method === 'upi' || p.payment_method === 'online'
                ? <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                : <Banknote className="w-3.5 h-3.5 text-green-500" />
              }
              <span className="text-gray-600">
                {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
              </span>
              <span className="capitalize badge badge-neutral text-[10px]">{p.payment_method || 'cash'}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-900">{formatCurrency(p.amount_paid)}</span>
              {Number(p.change_amount || 0) > 0 && (
                <span className="ml-1 text-emerald-600">(+{formatCurrency(p.change_amount)} wallet)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bill Card ────────────────────────────────────────────────────────────
function BillCard({ bill, onPay, customers }) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [customerGave, setCustomerGave] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPayment, setShowPayment] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  // grossAmount = original bill before wallet deduction
  const grossAmount  = Number(bill.bill_amount || bill.gross_amount || bill.total_amount || 0);
  // totalAmount = what customer actually owes after credit applied
  const totalAmount  = Number(bill.amount_paid || 0) + Number(bill.balance || 0) || Number(bill.total_amount || 0);
  const paidAmount   = Number(bill.amount_paid || 0);
  const balance      = Number(bill.balance || 0);
  const creditUsed   = Number(bill.credit_used || 0);
  // walletPaid: full bill covered by credit, no cash payment needed
  const walletPaid   = grossAmount > 0 && totalAmount === 0;

  // Change calculation: if customer gave more than the payment amount
  const gave = parseFloat(customerGave) || 0;
  const payAmt = parseFloat(paymentAmount) || 0;
  const change = gave > payAmt ? gave - payAmt : 0;

  const handlePay = () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    onPay(bill.id, bill.customer_id, amt, paymentMethod);
    setPaymentAmount('');
    setCustomerGave('');
    setShowPayment(false);
  };

  const handlePayFull = () => {
    if (balance <= 0) return toast.error('Bill is already paid');
    setPaymentAmount(String(balance));
    setCustomerGave(String(balance));
    setShowPayment(true);
  };

  const handleShareWhatsApp = () => {
    const cust = customers?.find(c => c.id === bill.customer_id);
    const rate = cust?.milk_rate_per_liter || 0;
    const totalQty = Number(bill.total_quantity || 0);
    const extraMilk = Number(bill.total_extra_milk || 0);
    const baseMilk = totalQty - extraMilk;
    const leaveDays = Number(bill.leave_days || 0);
    const gross = Number(bill.bill_amount || bill.gross_amount || bill.total_amount || 0);

    const fmtDate = (d) => {
      if (!d) return '—';
      return new Date(d + (typeof d === 'string' && d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const lines = [
      '🧾 *MILK BILL RECEIPT*',
      '━━━━━━━━━━━━━━━━━',
      `*Customer:* ${cust?.name || bill.customer_name || bill.customer_id}`,
      `*Bill Date:* ${fmtDate(bill.bill_start_date)} – ${fmtDate(bill.bill_end_date)}`,
      `*Period:* ${getMonthName(bill.bill_month)} ${bill.bill_year}`,
      `*Rate:* ₹${Number(rate).toFixed(2)}/L`,
      '━━━━━━━━━━━━━━━━━',
    ];

    // Parse stored periods
    let periods = [];
    try { periods = JSON.parse(bill.periods || '[]'); } catch { periods = []; }

    if (periods.length > 0) {
      const fmt = (d) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      };
      lines.push('*Default Milk Periods:*');
      periods.forEach((p, i) => {
        lines.push(`  ${i + 1}. ${fmt(p.start)}–${fmt(p.end)} → ${Number(p.qty).toFixed(1)}L×${p.days}d = ${Number(p.total).toFixed(1)}L`);
      });
      const totalScheduled = periods.reduce((s, p) => s + Number(p.total || 0), 0);
      const totalPeriodDays = periods.reduce((s, p) => s + Number(p.days || 0), 0);
      lines.push(`  *Total Scheduled:* ${totalScheduled.toFixed(1)}L (${totalPeriodDays}d)`);
    }

    if (leaveDays > 0) {
      lines.push('', '*Leaves:*');
      lines.push(`  *Total Leave:* ${leaveDays}d`);
    }

    const activeDays = periods.length > 0
      ? periods.reduce((s, p) => s + Number(p.days || 0), 0) - leaveDays
      : 0;

    lines.push(
      '━━━━━━━━━━━━━━━━━',
      `*Base Milk:* ${baseMilk.toFixed(1)}L${activeDays > 0 ? ` (${activeDays} active days)` : ''}`,
      `*Extra Milk:* +${extraMilk.toFixed(1)}L`,
      `*Total Milk:* ${totalQty.toFixed(1)}L`,
      `*Total Amount:* ₹${gross.toFixed(2)}`,
    );
    if (creditUsed > 0) {
      lines.push(`*Credit Applied:* −₹${creditUsed.toFixed(2)}`);
    }
    lines.push(
      '━━━━━━━━━━━━━━━━━',
      `*Status:* ${bill.paid ? '✅ FULLY PAID' : `⏳ PENDING: ₹${Number(bill.balance || 0).toFixed(2)}`}`,
      '━━━━━━━━━━━━━━━━━',
      '_Generated by Dairy MS-Kowsick Reddy_',
    );
    const text = encodeURIComponent(lines.join('\n'));
    const phone = cust?.phone || '';
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  return (
    <Card className={cn(
      'glass-card p-5 animate-slide-up flex flex-col gap-4',
      bill.paid && 'border-l-4 border-l-emerald-500',
      !bill.paid && balance > 0 && 'border-l-4 border-l-amber-400',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm',
            bill.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
          )}>
            {getInitials(bill.customer_name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">#{bill.customer_id} {bill.customer_name}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {getMonthName(bill.bill_month)} {bill.bill_year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleShareWhatsApp}
            className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all mr-1"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {bill.paid
            ? <span className="badge badge-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</span>
            : <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Unpaid</span>
          }
        </div>
      </div>

      {/* Progress bar */}
      <PaymentProgress paid={paidAmount} total={totalAmount} grossAmount={grossAmount} />

      {/* Amounts grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
          <p className="text-gray-400 font-medium">Gross Bill</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{formatCurrency(grossAmount)}</p>
        </div>
        {creditUsed > 0 && (
          <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-100">
            <p className="text-purple-600 font-medium flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Credit Used
            </p>
            <p className="font-bold text-purple-800 text-sm mt-0.5">−{formatCurrency(creditUsed)}</p>
          </div>
        )}
        <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-100">
          <p className="text-indigo-600 font-medium">Final Amount</p>
          <p className="font-bold text-indigo-900 text-sm mt-0.5">{formatCurrency(totalAmount)}</p>
        </div>
        <div className={cn(
          'rounded-xl p-2.5 border text-sm',
          balance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
        )}>
          <p className={cn('font-medium text-xs', balance > 0 ? 'text-red-600' : 'text-emerald-600')}>
            {balance > 0 ? 'Remaining' : 'Fully Paid'}
          </p>
          <p className={cn('font-bold mt-0.5', balance > 0 ? 'text-red-700' : 'text-emerald-700')}>
            {balance > 0 ? formatCurrency(balance) : '✓ Done'}
          </p>
        </div>
      </div>

      {/* Extra details row */}
      <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
        {Number(bill.leave_days || 0) > 0 && (
          <span className="badge badge-warning">🏖 {bill.leave_days} leave days</span>
        )}
        {Number(bill.total_extra_milk || 0) > 0 && (
          <span className="badge badge-info">+{Number(bill.total_extra_milk).toFixed(2)}L extra</span>
        )}
        <span className="badge badge-neutral">{Number(bill.total_quantity || 0).toFixed(2)}L total</span>
      </div>

      {/* Ledger toggle */}
      <button
        onClick={() => setShowLedger(!showLedger)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors w-fit"
      >
        {showLedger ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showLedger ? 'Hide' : 'Show'} payment history
      </button>

      {showLedger && <PaymentLedger billId={bill.id} />}

      {/* Payment actions */}
      {walletPaid ? (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
            <Wallet className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-purple-700">Settled via Wallet Credit</span>
          </div>
        </div>
      ) : !bill.paid && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          {!showPayment ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="success" onClick={handlePayFull} className="text-xs py-2">
                <Check className="w-3.5 h-3.5" />
                Pay Full {formatCurrency(balance)}
              </Button>
              <Button variant="outline" onClick={() => setShowPayment(true)} className="text-xs py-2">
                Partial Pay
              </Button>
            </div>
          ) : (
            <div className="space-y-2 animate-slide-up">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Customer Gave (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={customerGave}
                    onChange={(e) => setCustomerGave(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Payment (₹)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              {change > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Change to return: <span className="text-sm font-bold">₹{change.toFixed(2)}</span>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn('btn text-xs py-2', paymentMethod === 'cash' ? 'btn-success' : 'btn-outline')}
                >
                  <Banknote className="w-3.5 h-3.5 mr-1" /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={cn('btn text-xs py-2', paymentMethod === 'upi' ? 'btn-primary' : 'btn-outline')}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> UPI
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handlePay} className="text-xs py-2">
                  <Check className="w-3.5 h-3.5" /> Save
                </Button>
                <Button variant="ghost" onClick={() => { setShowPayment(false); setPaymentAmount(''); setCustomerGave(''); }} className="text-xs py-2">
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

    </Card>
  );
}

// ── Generate Bill Preview ────────────────────────────────────────────────
function GeneratedBillPreview({ bill }) {
  if (!bill) return null;
  const grossAmount = Number(bill.total_amount || bill.bill_amount || bill.gross_amount || 0);
  const finalAmount = Number(bill.balance ?? bill.total_amount ?? 0);
  const creditUsed = Math.max(0, grossAmount - finalAmount);
  const items = [
    { label: 'Customer',      value: bill.customer_name },
    { label: 'Period',        value: `${getMonthName(bill.bill_month)} ${bill.bill_year}` },
    { label: 'Total Milk',    value: `${Number(bill.total_quantity || 0).toFixed(2)} L` },
    { label: 'Gross Amount',  value: formatCurrency(grossAmount) },
    { label: 'Credit Used',   value: creditUsed > 0 ? formatCurrency(creditUsed) : 'None' },
    { label: 'Net Payable',   value: formatCurrency(finalAmount) },
  ];

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        <p className="text-sm font-bold text-emerald-800">Bill Generated Successfully</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-emerald-600">{label}</p>
            <p className="font-bold text-emerald-900 text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Billing Page ────────────────────────────────────────────────────
export default function Billing() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('unpaid');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [billForm, setBillForm] = useState({
    customer_id: '',
    month: new Date().getMonth() + 1,
    year:  new Date().getFullYear(),
  });

  const { data: bills = [], isLoading, isError: billsIsError, error: _billsError, refetch, isFetching } = useQuery({
    queryKey: ['bills'],
    queryFn:  () => api.bills.getAll(),
  });

  const { data: customers = [], isError: custIsError, error: _custError, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => api.customers.getAll(),
  });

  const { data: allLeaves = [] } = useQuery({
    queryKey: ['all-leaves'],
    queryFn:  () => api.leave.getAll(),
  });

  const onLeaveCustomerIds = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const ids = new Set();
    allLeaves.forEach(l => {
      if (l.start_date <= today && (!l.end_date || l.end_date >= today)) {
        ids.add(l.customer_id);
      }
    });
    return ids;
  }, [allLeaves]);

  const paymentMutation = useMutation({
    mutationFn: (data) => api.payments.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      const wallet = Number(data.credit_added || data.wallet_added || 0);
      if (wallet > 0) toast.success(`✅ Paid! ₹${wallet.toFixed(2)} added to wallet`);
      else            toast.success('✅ Payment recorded successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const generateBillMutation = useMutation({
    mutationFn: (data) => api.bills.generate(data),
    onSuccess: (bill, variables, context) => {
      setGeneratedBill(bill);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      // Backend returns 200 for existing bills, 201 for new — both are success
      if (bill?.already_exists) {
        toast('⚠️ Bill already exists for this month', { icon: '📋' });
      } else {
        toast.success('✅ Bill generated successfully!');
      }
    },
    onError: (err) => toast.error(err.message || 'Failed to generate bill'),
  });

  const handlePay = (billId, customerId, amount, method = 'cash') => {
    const bill = bills.find(b => b.id === billId);
    const currentBalance = Number(bill?.balance || 0);
    const changeAmount = amount - currentBalance;

    paymentMutation.mutate({
      bill_id:        billId,
      customer_id:    customerId,
      amount_paid:    Number(amount),
      change_given:   changeAmount > 0 ? changeAmount : 0,
      payment_method: method,
      is_partial:     amount < currentBalance,
      is_full_with_change: changeAmount > 0,
      change_amount:  changeAmount > 0 ? changeAmount : 0,
    });
  };

  const handleGenerateBill = () => {
    if (!billForm.customer_id) return toast.error('Select a customer');
    generateBillMutation.mutate({
      customer_id: Number(billForm.customer_id),
      month:       Number(billForm.month),
      year:        Number(billForm.year),
    });
  };

  const handleGenerateBatch = async () => {
    setShowBatchConfirm(false);
    setIsGeneratingBatch(true);
    try {
      const res = await api.bills.generateBatch({
        month: Number(billForm.month),
        year: Number(billForm.year),
      });
      toast.success(`Successfully processed ${res.processed} bills!`);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const filteredBills = useMemo(() => {
    let result = [...bills];
    if (searchTerm) result = result.filter(b => b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus === 'paid')   result = result.filter(b => b.paid);
    if (filterStatus === 'unpaid') result = result.filter(b => !b.paid);
    return result;
  }, [bills, searchTerm, filterStatus]);

  // Summary stats
  const stats = useMemo(() => ({
    total:    bills.length,
    paid:     bills.filter(b => b.paid).length,
    unpaid:   bills.filter(b => !b.paid).length,
    revenue:  bills.reduce((s, b) => s + Number(b.amount_paid || 0), 0),
    pending:  bills.reduce((s, b) => s + Number(b.balance || 0), 0),
  }), [bills]);

  if (billsIsError || custIsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Failed to load billing data</h3>
          <p className="text-sm text-red-500 mb-4">Something went wrong while fetching data. Please try again.</p>
          <Button onClick={() => { refetch(); refetchCustomers(); }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52" />)}
    </div>
  );

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Invoices</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Payments & Dues</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Bills',   value: stats.total,            color: 'stat-card-blue',   icon: '📋' },
            { label: 'Paid',          value: stats.paid,             color: 'stat-card-green',  icon: '✅' },
            { label: 'Unpaid',        value: stats.unpaid,           color: 'stat-card-amber',  icon: '⏳' },
            { label: 'Pending (₹)',   value: formatCurrency(stats.pending), color: 'stat-card-rose', icon: '💰' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
              <p className="text-xs text-gray-500 font-medium">{icon} {label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Generate Bill panel */}
        <Card className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Generate Bills</h2>
              <p className="text-xs text-gray-400 mt-0.5">Leave days are excluded. Wallet credit auto-applied.</p>
            </div>
            <Button 
              onClick={() => setShowBatchConfirm(true)}
              disabled={isGeneratingBatch}
              variant="outline" className="border-indigo-200 text-indigo-600 text-xs py-2 h-auto"
            >
              {isGeneratingBatch ? '⏳ Processing...' : '⚡ Generate All for Month'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              value={String(billForm.customer_id)}
              onChange={(e) => { setBillForm(p => ({ ...p, customer_id: e.target.value })); setGeneratedBill(null); }}
              options={[
                { value: '', label: 'Select customer' },
                ...customers.filter(c => c.status === 'active').map(c => ({ value: String(c.id), label: onLeaveCustomerIds.has(c.id) ? `🏖️ #${c.id} ${c.name} - ${c.phone} (On Leave)` : `#${c.id} ${c.name} - ${c.phone}` })),
              ]}
            />
            <Select
              value={billForm.month}
              onChange={(e) => setBillForm(p => ({ ...p, month: e.target.value }))}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))}
            />
            <Input
              type="number"
              value={billForm.year}
              onChange={(e) => setBillForm(p => ({ ...p, year: e.target.value }))}
              placeholder="Year"
            />
            <Button
              onClick={handleGenerateBill}
              disabled={generateBillMutation.isPending}
            >
              {generateBillMutation.isPending ? '⏳ Generating...' : '⚡ Generate Bill'}
            </Button>
          </div>
          <GeneratedBillPreview bill={generatedBill} />
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer..."
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all',    label: '📋 All Bills' },
              { value: 'paid',   label: '✅ Paid Only' },
              { value: 'unpaid', label: '⏳ Unpaid Only' },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {/* Bill cards */}
        {filteredBills.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Receipt className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No bills found</h3>
            <p className="text-gray-400 mt-1 text-sm">Try changing filters or generate a new bill.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} onPay={handlePay} customers={customers} />
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={handleGenerateBatch}
        title="Generate Bills for All?"
        message={`Generate bills for ALL active customers for ${getMonthName(billForm.month)} ${billForm.year}? This action may create or update bills.`}
        confirmText="Yes, Generate All"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  );
}
