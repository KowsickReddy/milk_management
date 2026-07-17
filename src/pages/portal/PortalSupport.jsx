import React, { useState } from 'react';
import { Card, Button, Input } from '../../ui';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const SUPPORT_PHONE = process.env.REACT_APP_SUPPORT_PHONE || '+91 9876543210';

export default function PortalSupport({ user }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await api.portal.createComplaint({
        customer_id: user.id,
        subject,
        message
      });
      setSubmitted(true);
      toast.success("Complaint registered successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full p-8 text-center border-2 border-emerald-50 shadow-xl shadow-emerald-50">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h2>
          <p className="text-slate-500 mb-8">Your complaint has been registered. Our team will look into it shortly.</p>
          <Button onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); }} className="w-full">
            Send another message
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Support & Help</h1>
        <p className="text-sm text-slate-500">Have an issue with your delivery? Let us know.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Subject</label>
            <Input 
              placeholder="Ex: Missing delivery, Quality issue..." 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Message Details</label>
            <textarea 
              rows="5"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              placeholder="Describe your issue in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 gap-2">
            {loading ? 'Sending...' : (
              <>
                <Send className="w-4 h-4" /> Send Complaint
              </>
            )}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-indigo-400 font-bold uppercase">Call Us</p>
            <p className="text-sm font-bold text-indigo-900">{SUPPORT_PHONE}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Support Hours</p>
            <p className="text-sm font-bold text-slate-900">7 AM - 9 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}


