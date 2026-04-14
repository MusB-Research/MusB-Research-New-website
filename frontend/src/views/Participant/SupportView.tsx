import React from 'react';
import { 
    Clock, CheckCircle, AlertCircle, 
    ArrowRight, LifeBuoy, History, 
    FileText, MessageSquare, ChevronRight,
    ShieldCheck, Activity
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

const SupportView = ({ requests = [], onAction }: any) => {
    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'COMPLETED': return <Badge color="green">RESOLVED</Badge>;
            case 'APPROVED': return <Badge color="blue">APPROVED</Badge>;
            case 'IN_PROGRESS': return <Badge color="blue">IN PROGRESS</Badge>;
            case 'REJECTED': return <Badge color="red">REJECTED</Badge>;
            default: return <Badge color="blue">{status?.replace('_', ' ')}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-10 max-w-[1400px] pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-3">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Technical Coordination</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Assistance & Requests</h2>
                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Track protocol interactions and investigator queries</p>
                </div>
                <button 
                    onClick={() => onAction('General Help Request')}
                    className="px-8 py-4 bg-[#1E88E5] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-[#1565C0] transition-all shadow-lg shadow-blue-500/10 flex items-center gap-3 active:scale-95"
                >
                    <LifeBuoy className="w-5 h-5" /> Initiate Help Protocol
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Logs', value: requests.filter((r: any) => r.status !== 'COMPLETED').length, icon: Clock, color: 'text-[#1E88E5]', bg: 'bg-[#F0F6FF]' },
                    { label: 'Resolved Tickets', value: requests.filter((r: any) => r.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-[#4CAF50]', bg: 'bg-[#E8F5E9]' },
                    { label: 'Cloud Resilience', value: '100%', icon: ShieldCheck, color: 'text-[#1E88E5]', bg: 'bg-[#F0F6FF]' }
                ].map((stat, i) => (
                    <Card key={i} className="p-8 bg-white border-[#E3ECF5] flex items-center gap-6 group hover:shadow-md transition-all shadow-sm">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform border border-inherit`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-[0.15em]">{stat.label}</p>
                            <p className="text-3xl font-bold text-[#1A2B49] tracking-tight">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Request Registry */}
            <Card className="bg-white border-[#E3ECF5] shadow-xl overflow-hidden">
                <div className="p-10 border-b border-[#F8FBFF] flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[20px] bg-[#F8FBFF] flex items-center justify-center text-[#1E88E5] border border-[#E3ECF5] shadow-inner-sm">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight">Coordination Ledger</h3>
                            <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Audit of formal site communication requests.</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8FBFF]">
                                {['Transaction Type', 'Protocol Context', 'Registration Date', 'System Status', ''].map(h => (
                                    <th key={h} className="p-6 text-[11px] font-bold text-[#1A2B49] uppercase tracking-[0.18em] border-b border-[#E3ECF5] opacity-60">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8FBFF]">
                            {requests.length > 0 ? requests.map((row: any, i: number) => (
                                <tr key={row.id || i} className="hover:bg-[#F0F6FF]/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-[#E3ECF5] text-[#1E88E5] group-hover:text-[#1E88E5] flex items-center justify-center transition-all shadow-sm">
                                                <FileText className="w-4.5 h-4.5" />
                                            </div>
                                            <span className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">{row.request_type}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">
                                        {row.study_title || 'Distributed Research Hub'}
                                    </td>
                                    <td className="p-6 text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest opacity-60">
                                        {row.created_at_formatted || new Date(row.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-6">
                                        {getStatusBadge(row.status)}
                                    </td>
                                    <td className="p-6 text-right">
                                        <button 
                                            onClick={() => onAction('Request Status Update')}
                                            className="p-3 bg-white hover:bg-[#F0F6FF] rounded-xl text-[#1A2B49] hover:text-[#1E88E5] border border-[#E3ECF5] transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                        >
                                            <MessageSquare className="w-4.5 h-4.5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-28 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-70">
                                            <LifeBuoy className="w-16 h-16 text-[#1E88E5] mb-4" />
                                            <p className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-[0.25em]">No Logged Interactions</p>
                                            <p className="text-[11px] font-bold text-[#1A2B49] uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                                                Active requests will be recorded here following clinical initiation.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Emergency Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-[#E3F2FD] border border-[#1E88E5]/10 rounded-[32px] shadow-lg">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#1E88E5] flex items-center justify-center text-white shadow-lg">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-[16px] font-bold text-[#1A2B49] uppercase tracking-tight">Critical Outcome Mitigation?</h4>
                        <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Direct investigator sync is available for urgent safety deviations.</p>
                    </div>
                </div>
                <button 
                    onClick={() => onAction('Emergency Clinical Support')}
                    className="px-10 py-5 bg-white text-[#1E88E5] border-2 border-[#1E88E5]/20 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-[#1E88E5] hover:text-white transition-all shadow-md active:scale-95"
                >
                    Contact Safety Sync
                </button>
            </div>
        </div>
    );
};

export default SupportView;
