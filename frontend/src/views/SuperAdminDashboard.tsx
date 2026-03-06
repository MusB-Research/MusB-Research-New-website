import React from 'react';

export default function SuperAdminDashboard() {
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-8">
                Super Admin <span className="text-cyan-400">Dashboard</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'User Management', count: '124', icon: '👥' },
                    { label: 'System Logs', count: '2.5k', icon: '📝' },
                    { label: 'API Health', status: 'Healthy', icon: '⚡' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="text-4xl mb-4">{stat.icon}</div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{stat.label}</h3>
                        <p className="text-2xl font-black text-white">{stat.count || stat.status}</p>
                    </div>
                ))}
            </div>
            <div className="mt-12 p-8 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl">
                <p className="text-cyan-400 font-medium">Welcome, Super Admin. You have full access to all system modules.</p>
            </div>
        </div>
    );
}
