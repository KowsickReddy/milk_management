import React from 'react';
import { 
  Milk, Info, ExternalLink, Heart, Users, Truck, 
  Receipt, BarChart3, Shield, Smartphone, Globe, Code2
} from 'lucide-react';
import { Card, Button } from '../ui';

const features = [
  { icon: Milk,      label: 'Milk Collection',     desc: 'Track daily milk collection with shift management and extra milk tracking' },
  { icon: Truck,     label: 'Delivery Management',  desc: 'Manage daily deliveries with status tracking, leave management, and route planning' },
  { icon: Users,     label: 'Customer Management',  desc: 'Complete CRM with billing history, payment tracking, and credit management' },
  { icon: Receipt,   label: 'Billing & Payments',   desc: 'Automated billing with monthly generation, payment tracking, and credit wallet' },
  { icon: BarChart3, label: 'Reports & Analytics',  desc: 'Interactive dashboards with revenue charts, trends, and performance metrics' },
  { icon: Shield,    label: 'Access Control',       desc: 'Role-based access with admin/worker accounts and customer portal' },
  { icon: Smartphone,label: 'Customer Portal',      desc: 'Self-service portal for customers to view deliveries, bills, and submit complaints' },
  { icon: Globe,     label: 'Multi-platform',       desc: 'Works on desktop, tablet, and mobile with PWA support' },
];

const techStack = [
  { category: 'Frontend', items: 'React 18, Tailwind CSS, Framer Motion, React Query, Recharts, Lucide Icons' },
  { category: 'Backend',  items: 'Node.js, Express, PostgreSQL (Neon), JWT Authentication, bcrypt' },
  { category: 'Deployment', items: 'Netlify (Frontend), Render (Backend), Neon (Database)' },
  { category: 'Security', items: 'Helmet, CORS, Rate Limiting, bcrypt Password Hashing, WebAuthn/FIDO2' },
];

export default function About() {
  return (
    <div className="pb-28">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">About</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dairy Management ERP</p>
          </div>
        </div>

        {/* Brand section */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-indigo-100/50">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 md:p-12 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Milk className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Dairy Management ERP</h2>
            <p className="text-indigo-200 font-medium text-lg">Streamline Your Dairy Business</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Version 2.0.0 — Production Ready
            </div>
          </div>
          <div className="p-8 md:p-10 space-y-6">
            <p className="text-slate-600 leading-relaxed">
              A comprehensive Enterprise Resource Planning (ERP) solution designed specifically for dairy farms 
              and milk distribution businesses. Manage customers, track daily deliveries, automate billing, 
              generate reports, and provide a self-service portal for customers — all in one platform.
            </p>
          </div>
        </Card>

        {/* Key Features */}
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5">Technology Stack</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map(({ category, items }) => (
              <Card key={category} className="p-5">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{category}</h3>
                <p className="text-sm font-medium text-slate-700">{items}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Deployment Info */}
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5">Deployment</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {[
                { label: 'Frontend', value: 'Netlify', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Backend API', value: 'Render', color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Database', value: 'Neon PostgreSQL', color: 'text-purple-600 bg-purple-50' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${color}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Credits Footer */}
        <div className="text-center py-12 border-t border-slate-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4 shadow-inner border-2 border-white">
            <span className="text-2xl">👨‍💻</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Designed & Developed by</h3>
          <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            JoyBoy
          </p>
          <p className="text-sm text-slate-500 mt-1">Kowsick Reddy Korimella</p>
          <div className="flex items-center justify-center gap-1 mt-4 text-xs text-slate-400">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Made with passion for dairy farmers</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-4">
            <a href="https://github.com/KowsickReddy/milk_management" target="_blank" rel="noopener noreferrer" className="btn btn-outline inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold">
              <Code2 className="w-4 h-4" />
              Source Code
            </a>
          </div>
          
          <p className="mt-8 text-[10px] text-slate-300 font-medium">
            © {new Date().getFullYear()} Dairy Management ERP. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
