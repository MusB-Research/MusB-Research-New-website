import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-8">
                Admin <span className="text-cyan-400">Portal</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: 'Active Studies', count: '12', icon: '🔬' },
                    { label: 'Pending Inquiries', count: '45', icon: '✉️' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="text-4xl mb-4">{stat.icon}</div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{stat.label}</h3>
                        <p className="text-2xl font-black text-white">{stat.count}</p>
                    </div>
                ))}
            </div>
            <div className="mt-12 p-8 bg-slate-800/50 border border-white/10 rounded-3xl">
                <p className="text-slate-300 font-medium">Admin view: Access to studies and contact management.</p>
            </div>
        </div>
    );
}
