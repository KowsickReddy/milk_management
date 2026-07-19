import React, { useState, useEffect } from 'react';
import { Card, Button, Select } from '../../ui';
import {
  Calendar, ChevronLeft, ChevronRight, Milk, CheckCircle2,
  XCircle, Plus, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { cn, getMonthName } from '../../lib/utils';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PortalCalendar({ user }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const lastDay = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedDay(null);
    (async () => {
      try {
        const json = await api.portal.getCalendar(user.id, year, month);
        if (cancelled) return;
        setData(json);
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
  }, [user.id, year, month]);

  const navigateMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const getDayColor = (daySummary) => {
    if (!daySummary) return 'bg-slate-50 text-slate-400';
    if (daySummary.extra) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (daySummary.delivered) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (daySummary.leave) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-slate-50 text-slate-400';
  };

  const getDayIndicator = (daySummary) => {
    if (!daySummary) return null;
    if (daySummary.extra) return <Plus className="w-3 h-3 text-blue-500" />;
    if (daySummary.delivered) return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    if (daySummary.leave) return <XCircle className="w-3 h-3 text-red-500" />;
    return null;
  };

  const calendarData = data?.calendar || [];
  const calendarMap = {};
  calendarData.forEach(d => { calendarMap[d.day] = d; });

  // Build grid with empty cells for first day offset
  const grid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    grid.push(null); // empty cell
  }
  for (let day = 1; day <= lastDay; day++) {
    grid.push(day);
  }

  const selectedDayData = selectedDay ? calendarMap[selectedDay] : null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading calendar...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="max-w-md mx-auto p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <p className="font-bold text-red-600">Failed to load calendar</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{error}</p>
        <Button onClick={() => setError(null)} variant="primary">Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Delivery Calendar</h1>
        <p className="text-sm text-slate-500">Track your daily milk delivery status at a glance.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span className="text-slate-600 font-medium">Delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span className="text-slate-600 font-medium">Not Delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span className="text-slate-600 font-medium">Extra Milk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
          <span className="text-slate-600 font-medium">No Record</span>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="p-4 md:p-6 overflow-hidden">
        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">
              {getMonthName(month)} {year}
            </span>
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={MONTHS}
              className="w-24"
            />
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const daySummary = calendarMap[day]?.summary;
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = selectedDay === day;
            const hasData = daySummary && (daySummary.delivered || daySummary.leave || daySummary.extra);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl transition-all duration-200',
                  'text-xs sm:text-sm font-bold min-h-[48px] sm:min-h-[56px]',
                  getDayColor(daySummary),
                  isToday && 'ring-2 ring-indigo-500 ring-offset-2',
                  isSelected && 'scale-110 shadow-lg z-10',
                  !hasData && !isToday && 'hover:bg-slate-100',
                  hasData && 'cursor-pointer hover:scale-105'
                )}
              >
                <span>{day}</span>
                {daySummary && daySummary.totalQuantity > 0 && (
                  <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 opacity-80">
                    {daySummary.totalQuantity.toFixed(1)}L
                  </span>
                )}
                {/* Indicator dot */}
                {daySummary && (daySummary.delivered || daySummary.leave || daySummary.extra) && (
                  <div className="absolute -top-0.5 -right-0.5">
                    {getDayIndicator(daySummary)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Detail */}
      {selectedDayData && (
        <Card className="p-5 border-l-4 border-l-indigo-500 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedDayData.date ? new Date(selectedDayData.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  }) : `${getMonthName(month)} ${selectedDay}, ${year}`}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedDayData.summary.totalQuantity > 0
                    ? `${selectedDayData.summary.totalQuantity.toFixed(1)}L total`
                    : selectedDayData.summary.leave
                    ? 'No delivery (Leave)'
                    : 'No record'}
                </p>
              </div>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-bold',
              selectedDayData.summary.extra ? 'bg-blue-100 text-blue-700'
              : selectedDayData.summary.delivered ? 'bg-emerald-100 text-emerald-700'
              : selectedDayData.summary.leave ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-500'
            )}>
              {selectedDayData.summary.extra ? 'Extra Milk'
                : selectedDayData.summary.delivered ? 'Delivered'
                : selectedDayData.summary.leave ? 'Not Delivered'
                : 'No Record'}
            </div>
          </div>

          {/* Entries for this day */}
          {selectedDayData.entries.length > 0 ? (
            <div className="space-y-2">
              {selectedDayData.entries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Milk className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 capitalize">
                      {entry.shift}
                    </span>
                    <span className={cn(
                      'badge text-[10px]',
                      entry.status === 'delivered' ? 'badge-success'
                      : entry.status === 'extra' ? 'badge-info'
                      : entry.status === 'leave' ? 'badge-danger'
                      : 'badge-neutral'
                    )}>
                      {entry.status}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {entry.quantity.toFixed(1)}L
                    {entry.extraMilk > 0 && (
                      <span className="text-blue-500 text-xs ml-1">(+{entry.extraMilk.toFixed(1)} extra)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              {selectedDayData.summary.leave
                ? 'This day was marked as leave / no delivery.'
                : 'No delivery record for this date.'}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
