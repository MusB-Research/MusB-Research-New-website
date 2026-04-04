import React from 'react';
import { 
    Clock, CheckCircle, AlertCircle, 
    ArrowRight, LifeBuoy, History, 
    FileText, MessageSquare 
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

const SupportView = ({ requests = [], onAction }: any) => {
    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'green';
            case 'APPROVED': return 'cyan';
            case 'IN_PROGRESS': return 'blue';
            case 'REJECTED': return 'red';
            default: return 'amber';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
                        Help & <span className="text-cyan-400">Request History</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px] italic">
                        Track your clinical interactions and site requests in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onAction('General Help Request')}
                        className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                    >
                        <LifeBuoy className="w-4 h-4" /> New Help Request
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Requests', value: requests.filter((r: any) => r.status !== 'COMPLETED').length, icon: Clock, color: 'text-amber-400' },
                    { label: 'Resolved Missions', value: requests.filter((r: any) => r.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-green-400' },
                    { label: 'System Uptime', value: '100%', icon: ShieldCheck, color: 'text-cyan-400' }
                ].map((stat, i) => (
                    <Card key={i} className="p-6 bg-[#141e35]/40 border-white/5 flex items-center gap-5 group hover:border-white/10 transition-all">
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                            <p className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Request Registry */}
            <Card className="bg-[#141e35]/40 border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white italic uppercase tracking-widest">Audit Registry</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Formal history of all coordination requests.</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                                <th className="p-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Request Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Origin Point</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">System Timestamp</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Status Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map((row: any, i: number) => (
                                <tr key={row.id || i} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6 px-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 transition-all group-hover:scale-110">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-black text-white italic uppercase tracking-tight">{row.request_type}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm font-bold text-slate-300 uppercase tracking-widest italic opacity-70">
                                        {row.study_title || 'Clinical Research Node'}
                                    </td>
                                    <td className="p-6 text-[11px] font-black text-slate-500 italic uppercase">
                                        {row.created_at_formatted || new Date(row.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Badge color={getStatusColor(row.status)}>
                                                <div className="flex items-center gap-1.5 uppercase italic">
                                                    {getStatusIcon(row.status)}
                                                    {row.status?.replace('_', ' ')}
                                                </div>
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button 
                                            onClick={() => onAction('Request Status Update')}
                                            className="p-2 text-slate-500 hover:text-cyan-400 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <LifeBuoy className="w-16 h-16 text-slate-500 mb-2 animate-pulse" />
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] italic">No Interaction History Found</p>
                                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest max-w-[320px] leading-relaxed">
                                                Your coordination history is empty. Site requests will appear here once you initiate a clinical workflow.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Support Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white italic uppercase tracking-widest">Urgent Clinical Escalation?</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Direct communication is available for critical protocol issues.</p>
                    </div>
                </div>
                <button 
                    onClick={() => onAction('Emergency Clinical Support')}
                    className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-slate-950 transition-all shadow-xl active:scale-95"
                >
                    Contact Coordinator
                </button>
            </div>
        </div>
    );
};

// Mock icon for internal grid
const ShieldCheck = ({ className }: any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;

export default SupportView;
