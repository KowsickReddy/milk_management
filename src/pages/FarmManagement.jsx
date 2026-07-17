import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Calendar, 
  RefreshCw,
  Beef,
  Package,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { Card, Button, Input, Select, ModalContent, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '../ui';
import { toast } from 'react-hot-toast';
import { formatCurrency, getToday } from '../lib/utils';
import { format, addMonths } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FarmManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cattle'); 
  const [showCattleModal, setShowCattleModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'cattle'|'feed', id }

  // Cattle State
  const initialCattleForm = {
    tag_number: '',
    breed: '',
    entry_date: getToday(),
    acquisition_cost: '',
    transport_cost: '',
    status: 'milking',
    is_in_calf: false,
    gestation_start_date: ''
  };
  const [cattleForm, setCattleForm] = useState(initialCattleForm);

  // Feed State
  const initialFeedForm = {
    purchase_date: getToday(),
    feed_type: '',
    bags_bought: '',
    cost_per_bag: ''
  };
  const [feedForm, setFeedForm] = useState(initialFeedForm);

  const { data: cattle = [], isLoading: loadingCattle, isError: cattleIsError, error: _cattleError, refetch: refetchCattle } = useQuery({
    queryKey: ['cattle'],
    queryFn: () => api.cattle.getAll(),
  });

  const { data: feed = [], isLoading: loadingFeed, isError: feedIsError, error: _feedError, refetch: refetchFeed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.feed.getAll(),
  });

  const { data: stats, isError: statsIsError, error: _statsError, refetch: refetchStats } = useQuery({
    queryKey: ['farm-stats'],
    queryFn: () => api.analytics.getFarmStats(),
  });

  const cattleMutation = useMutation({
    mutationFn: (data) => editingId ? api.cattle.update(editingId, data) : api.cattle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cattle'] });
      queryClient.invalidateQueries({ queryKey: ['farm-stats'] });
      toast.success(editingId ? '✅ Cattle updated' : '✅ Cattle saved');
      handleCloseCattleModal();
    },
    onError: (err) => toast.error(err.message || 'Failed to save cattle'),
  });

  const feedMutation = useMutation({
    mutationFn: (data) => api.feed.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['farm-stats'] });
      toast.success('✅ Feed purchase logged');
      setShowFeedModal(false);
      setFeedForm(initialFeedForm);
    },
    onError: (err) => toast.error(err.message || 'Failed to save feed'),
  });

  const handleEditCattle = (cow) => {
    setEditingId(cow.id);
    setCattleForm({
      tag_number: cow.tag_number || '',
      breed: cow.breed || '',
      entry_date: cow.entry_date ? cow.entry_date.split('T')[0] : getToday(),
      acquisition_cost: cow.acquisition_cost || 0,
      transport_cost: cow.transport_cost || 0,
      status: cow.status || 'milking',
      is_in_calf: !!cow.is_in_calf,
      gestation_start_date: cow.gestation_start_date ? cow.gestation_start_date.split('T')[0] : ''
    });
    setShowCattleModal(true);
  };

  const handleCloseCattleModal = () => {
    setShowCattleModal(false);
    setEditingId(null);
    setCattleForm(initialCattleForm);
  };

  const handleSaveCattle = () => {
    if (!cattleForm.tag_number || !cattleForm.tag_number.trim()) {
      toast.error('Tag number is required');
      return;
    }
    const payload = {
      ...cattleForm,
      acquisition_cost: cattleForm.acquisition_cost === '' ? 0 : Number(cattleForm.acquisition_cost),
      transport_cost: cattleForm.transport_cost === '' ? 0 : Number(cattleForm.transport_cost),
    };
    cattleMutation.mutate(payload);
  };

  const handleSaveFeed = () => {
    if (!feedForm.feed_type || !feedForm.feed_type.trim()) {
      toast.error('Feed type is required');
      return;
    }
    const payload = {
      ...feedForm,
      bags_bought: Number(feedForm.bags_bought) || 0,
      cost_per_bag: Number(feedForm.cost_per_bag) || 0
    };
    feedMutation.mutate(payload);
  };

  if (cattleIsError || feedIsError || statsIsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Failed to load farm data</h3>
          <p className="text-sm text-red-500 mb-4">Something went wrong while fetching data. Please try again.</p>
          <Button onClick={() => { refetchCattle(); refetchFeed(); refetchStats(); }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (loadingCattle || loadingFeed) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44" />)}
      </div>
    );
  }

  return (
    <>
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Beef className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Farm Management</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Breeding & Feed Logs</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('cattle')}
              className={cn("px-4 md:px-6 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'cattle' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
            >
              Cattle
            </button>
            <button 
              onClick={() => setActiveTab('feed')}
              className={cn("px-4 md:px-6 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'feed' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
            >
              Feed
            </button>
          </div>
        </div>
        {/* Farm Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Cattle</p>
            <p className="text-xl md:text-2xl font-black text-indigo-600">{stats?.summary?.total_cattle || 0}</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Investment</p>
            <p className="text-lg md:text-xl font-black text-slate-900">{formatCurrency(stats?.summary?.total_investment || 0)}</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Bags</p>
            <p className="text-xl md:text-2xl font-black text-emerald-600">{stats?.summary?.total_bags || 0}</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Expended</p>
            <p className="text-lg md:text-xl font-black text-slate-900">{formatCurrency(stats?.summary?.total_feed_cost || 0)}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'cattle' ? (
            <motion.div key="cattle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cattle Inventory</h2>
                <Button onClick={() => setShowCattleModal(true)} className="gap-2 px-6 h-11 shadow-indigo-200">
                  <Plus className="w-4 h-4" /> Add Cattle
                </Button>
              </div>

              {stats?.upcoming_calving?.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-amber-900 uppercase tracking-widest text-xs">Upcoming Calving Alerts</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stats.upcoming_calving.map(c => (
                        <span key={c.id} className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-amber-600 border border-amber-200">
                          #{c.tag_number} ({format(new Date(c.expected_calving_date), 'MMM dd')})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cattle.map((cow) => {
                  const calvingDate = cow.gestation_start_date ? addMonths(new Date(cow.gestation_start_date), 10) : null;
                  return (
                    <Card key={cow.id} className="p-6 border-slate-100 hover:shadow-lg transition-all group overflow-hidden relative bg-white/70">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                            cow.status === 'milking' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
                          )}>
                            <Beef className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">#{cow.tag_number}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cow.breed}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "badge",
                            cow.status === 'milking' ? "badge-success" : cow.status === 'dry' ? "badge-neutral" : "badge-info"
                          )}>
                            {cow.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <Calendar className="w-3 h-3" /> Entry: {cow.entry_date ? format(new Date(cow.entry_date), 'MMM dd, yyyy') : 'N/A'}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Purchase Cost</p>
                          <p className="font-bold text-slate-900 text-sm">{formatCurrency(cow.acquisition_cost)}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Transport</p>
                          <p className="font-bold text-slate-900 text-sm">{formatCurrency(cow.transport_cost)}</p>
                        </div>
                      </div>

                      {cow.is_in_calf ? (
                        <div className="mt-4 p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                          <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Breeding State: In-Calf</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-indigo-100 font-bold uppercase">Expected Calving</p>
                              <p className="text-sm font-black">{calvingDate ? format(calvingDate, 'MMM dd, yyyy') : 'N/A'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                          <p className="text-[10px] text-slate-300 font-black uppercase text-center tracking-widest">Breeding State: Not In-Calf</p>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditCattle(cow)} className="p-2 rounded-xl bg-white/80 backdrop-blur shadow-sm text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget({ type: 'cattle', id: cow.id })} className="p-2 rounded-xl bg-white/80 backdrop-blur shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Feed Purchases</h2>
                <Button onClick={() => setShowFeedModal(true)} className="gap-2 px-6 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100">
                  <Plus className="w-4 h-4" /> Log Purchase
                </Button>
              </div>

              <Card className="border-slate-100 shadow-sm bg-white/60 p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Feed Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bags</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rate/Bag</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {feed.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{format(new Date(f.purchase_date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Package className="w-4 h-4" />
                            </div>
                            {f.feed_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-emerald-600 text-center">{f.bags_bought}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-bold text-center">₹{f.cost_per_bag}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(f.total_cost)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setDeleteTarget({ type: 'feed', id: f.id })} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cattle Modal */}
      <AnimatePresence>
        {showCattleModal && (
          <ModalContent isOpen={showCattleModal} onClose={handleCloseCattleModal} size="lg">
            <ModalHeader onClose={handleCloseCattleModal}>
              {editingId ? 'Edit Cattle Record' : 'Add New Cattle'}
            </ModalHeader>
            <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Tag Number" placeholder="Ex: C001" value={cattleForm.tag_number} onChange={e => setCattleForm({...cattleForm, tag_number: e.target.value})} />
              <Input label="Breed" placeholder="Ex: Holstein" value={cattleForm.breed} onChange={e => setCattleForm({...cattleForm, breed: e.target.value})} />
              <Input label="Entry Date" type="date" value={cattleForm.entry_date} onChange={e => setCattleForm({...cattleForm, entry_date: e.target.value})} />
              <Select 
                label="Cattle Status" 
                value={cattleForm.status} 
                onChange={e => setCattleForm({...cattleForm, status: e.target.value})}
                options={[
                  { value: 'milking', label: 'Milking' },
                  { value: 'dry', label: 'Dry / Non-Milking' },
                  { value: 'heifer', label: 'Heifer' },
                  { value: 'calf', label: 'Calf' },
                ]}
              />
              <Input label="Purchase Cost (₹)" type="number" placeholder="0.00" value={cattleForm.acquisition_cost} onChange={e => setCattleForm({...cattleForm, acquisition_cost: e.target.value})} />
              <Input label="Transport Cost (₹)" type="number" placeholder="0.00" value={cattleForm.transport_cost} onChange={e => setCattleForm({...cattleForm, transport_cost: e.target.value})} />
              
              <div className="flex flex-col justify-end">
                <label className={cn(
                  "flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl border transition-all",
                  cattleForm.is_in_calf ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 border-slate-200 text-slate-700"
                )}>
                  <input type="checkbox" checked={cattleForm.is_in_calf} onChange={e => setCattleForm({...cattleForm, is_in_calf: e.target.checked})} className="w-4 h-4 rounded border-white/20 text-indigo-600 focus:ring-white/20" />
                  <span className="text-sm font-black uppercase tracking-tight text-current">In-Calf State</span>
                </label>
              </div>

              {cattleForm.is_in_calf && (
                <div className="md:col-span-2">
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-2 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <Input label="Gestation Start Date" type="date" value={cattleForm.gestation_start_date} onChange={e => setCattleForm({...cattleForm, gestation_start_date: e.target.value})} className="bg-white" />
                      <p className="text-[10px] text-indigo-500 font-bold mt-2 ml-1 uppercase italic">* Expected calving: 10 months from this date.</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={handleCloseCattleModal}>Cancel</Button>
              <Button onClick={handleSaveCattle} disabled={cattleMutation.isPending}>
                {cattleMutation.isPending ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </AnimatePresence>

      {/* Feed Modal */}
      <AnimatePresence>
        {showFeedModal && (
          <ModalContent isOpen={showFeedModal} onClose={() => setShowFeedModal(false)} size="md">
            <ModalHeader onClose={() => setShowFeedModal(false)}>
              Log Feed Purchase
            </ModalHeader>
            <ModalBody className="space-y-5">
              <Input label="Purchase Date" type="date" value={feedForm.purchase_date} onChange={e => setFeedForm({...feedForm, purchase_date: e.target.value})} />
              <Input label="Feed Type" placeholder="Ex: Silage, Green Fodder" value={feedForm.feed_type} onChange={e => setFeedForm({...feedForm, feed_type: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bags Bought" type="number" placeholder="0" value={feedForm.bags_bought} onChange={e => setFeedForm({...feedForm, bags_bought: e.target.value})} />
                <Input label="Cost per Bag (₹)" type="number" placeholder="0.00" value={feedForm.cost_per_bag} onChange={e => setFeedForm({...feedForm, cost_per_bag: e.target.value})} />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => { setShowFeedModal(false); setFeedForm(initialFeedForm); }}>Cancel</Button>
              <Button variant="success" onClick={handleSaveFeed} disabled={feedMutation.isPending}>
                {feedMutation.isPending ? 'Processing...' : 'Save Purchase Log'}
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </AnimatePresence>
    </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.type === 'cattle') {
              await api.cattle.delete(deleteTarget.id);
              queryClient.invalidateQueries({ queryKey: ['cattle'] });
              toast.success('Cattle record deleted');
            } else {
              await api.feed.delete(deleteTarget.id);
              queryClient.invalidateQueries({ queryKey: ['feed'] });
              toast.success('Feed record deleted');
            }
            queryClient.invalidateQueries({ queryKey: ['farm-stats'] });
          } catch (err) {
            toast.error(err.message);
          } finally {
            setDeleteTarget(null);
          }
        }}
        title={deleteTarget?.type === 'cattle' ? 'Delete Cattle Record?' : 'Delete Feed Record?'}
        message={deleteTarget?.type === 'cattle' ? 'Remove this cattle record? This cannot be undone.' : 'Remove this feed purchase record? This cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
