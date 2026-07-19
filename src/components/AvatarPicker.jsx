import React, { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

const DEFAULT_AVATARS = [
  { color: 'bg-indigo-500', label: 'Indigo' },
  { color: 'bg-emerald-500', label: 'Green' },
  { color: 'bg-amber-500', label: 'Amber' },
  { color: 'bg-rose-500', label: 'Rose' },
  { color: 'bg-purple-500', label: 'Purple' },
  { color: 'bg-blue-500', label: 'Blue' },
  { color: 'bg-cyan-500', label: 'Cyan' },
  { color: 'bg-teal-500', label: 'Teal' },
];

export default function AvatarPicker({ currentPhoto, name, onSave, size = 'lg' }) {
  const [preview, setPreview] = useState(currentPhoto || null);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const sizeClasses = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : size === 'sm'
    ? 'w-10 h-10 text-sm'
    : 'w-14 h-14 text-lg';

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      // Auto-save the data URL
      handleSave(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectColor = (color) => {
    // For color-only avatars, we don't save anything
    // But we can remove the photo
    handleSave(null);
    setShowPicker(false);
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    handleSave(null);
  };

  const handleSave = async (photoData) => {
    setSaving(true);
    try {
      await onSave(photoData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initial = (name || '?')[0].toUpperCase();

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden cursor-pointer group',
          sizeClasses,
          'bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0'
        )}
        onClick={() => setShowPicker(!showPicker)}
      >
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {saving && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Picker popup */}
      {showPicker && (
        <div className="absolute top-full mt-2 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700">Choose photo</p>
            <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Upload */}
          <label className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-indigo-50 cursor-pointer transition-colors">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-slate-700">Upload photo</span>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>

          {/* Color presets */}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color presets</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AVATARS.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => handleSelectColor(color)}
                  className={cn('w-8 h-8 rounded-xl', color, 'hover:scale-110 transition-transform')}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Remove */}
          {preview && (
            <button
              onClick={handleRemovePhoto}
              className="w-full mt-2 p-2 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-bold transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
