import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, Trash2, Smartphone, RefreshCw } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../services/api';
import { Button, ConfirmModal } from '../ui';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function FingerprintManager({ userId, username }) {
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id }

  const { data: credentials = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['webauthn-creds', userId],
    queryFn: () => api.webauthn.getCredentials(userId),
    enabled: !!userId,
  });

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const options = await api.webauthn.registerBegin({ userId, username });
      const credential = await startRegistration(options);
      await api.webauthn.registerComplete({ userId, username, credential, deviceName: navigator.userAgent });
      toast.success('Fingerprint registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['webauthn-creds', userId] });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget({ id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await api.webauthn.deleteCredential(id);
      queryClient.invalidateQueries({ queryKey: ['webauthn-creds', userId] });
      toast.success('Biometric removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!userId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> Biometric Devices
        </h4>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          </button>
          <Button onClick={handleRegister} loading={registering} size="sm" className="text-[10px] gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" /> Register
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton h-10 w-full rounded-xl" />
      ) : credentials.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No biometric devices registered. Click "Register" to add your fingerprint.</p>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div key={cred.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{cred.device_name?.slice(0, 40) || 'Unknown Device'}</p>
                  <p className="text-[10px] text-slate-400">
                    Registered {format(new Date(cred.created_at), 'MMM dd, yyyy')}
                    {cred.last_used_at && ` · Last used ${format(new Date(cred.last_used_at), 'MMM dd')}`}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(cred.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove Biometric Device?"
        message="Are you sure you want to remove this biometric device? You will need to re-register to use fingerprint login."
        confirmText="Yes, Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
