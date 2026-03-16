import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { authFetch } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WorkflowModerationPanel() {
    const [activeTab, setActiveTab] = useState<'studies'|'news'|'events'>('news');
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingContent = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/${activeTab}/`);
            if (res.ok) {
                const data = await res.json();
                // Filter locally or rely on backend returning pending if we were passing query params
                setContent(data.filter((item: any) => item.status === 'pending' || item.approval_status === 'pending'));
            }
        } catch (error) {
            console.error('Error fetching pending content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingContent();
    }, [activeTab]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const res = await authFetch(`${API_URL}/api/${activeTab}/${id}/${action}/`, {
                method: 'POST'
            });
            if (res.ok) {
                alert(`Content successfully ${action}d!`);
                fetchPendingContent(); // refresh
            } else {
                alert('Action failed. Ensure you have Super Admin permissions.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Content Moderation Queue</h2>
                    <p className="text-sm text-slate-500 mt-1">Review pending submissions from Investigators and Coordinators</p>
                </div>
            </div>

            <div className="p-4 border-b border-slate-200 flex space-x-4">
                {['news', 'events', 'studies'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading queue...</div>
                ) : content.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mb-4 opacity-50" />
                        <p>No pending submissions for {activeTab}.</p>
                        <p className="text-sm mt-1">You are all caught up!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {content.map((item) => (
                            <li key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start justify-between">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded-md flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Pending Review
                                        </span>
                                        {item.is_success_story && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase rounded-md">
                                                Success Story
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        {item.content || item.description || 'No description provided.'}
                                    </p>
                                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-4">
                                        <span>Submitted on: {new Date(item.created_at || item.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAction(item.id, 'approve')}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(item.id, 'reject')}
                                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
