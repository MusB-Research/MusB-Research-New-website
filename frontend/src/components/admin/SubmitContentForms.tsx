import React, { useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { authFetch } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SubmitContentForms({ userRole }: { userRole: string }) {
    const [submitting, setSubmitting] = useState(false);
    const [activeForm, setActiveForm] = useState<'study' | 'news' | 'event'>('news');
    const [formData, setFormData] = useState({
        title: '',
        description: '', // or content
        image: '',
        is_success_story: false,
        event_date: '',
        sponsor_name: '',
        protocol_id: ''
    });

    const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        console.log(`Submitting ${activeForm} to API as ${userRole}`);
        
        try {
            // Map form data to match backend definitions
            const payload: any = {
                title: formData.title,
                status: isSuperAdmin ? 'approved' : 'pending' // though the backend sets it automatically
            };

            if (activeForm === 'study') {
                payload.description = formData.description;
                payload.sponsor_name = formData.sponsor_name;
                payload.protocol_id = formData.protocol_id;
            } else if (activeForm === 'news') {
                payload.content = formData.description;
                payload.image = formData.image;
                payload.is_success_story = formData.is_success_story;
            } else if (activeForm === 'event') {
                payload.description = formData.description;
                payload.event_date = new Date(formData.event_date).toISOString();
            }

            const res = await authFetch(`${API_URL}/api/${activeForm === 'study' ? 'studies' : activeForm}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`Successfully submitted! ${isSuperAdmin ? 'It is now live.' : 'It is pending approval.'}`);
                setFormData({
                    title: '', description: '', image: '', is_success_story: false, event_date: '', sponsor_name: '', protocol_id: ''
                });
            } else {
                const error = await res.json();
                alert(`Error: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            console.error('Submission failed', error);
            alert('A critical error occurred while submitting.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Submit New Content</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {isSuperAdmin 
                            ? 'As a Super Admin, your content will be published directly.'
                            : 'Submit studies, news, and events for Super Admin approval.'}
                    </p>
                </div>
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    {['news', 'event', 'study'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setActiveForm(type as any)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                                activeForm === type 
                                ? 'bg-white shadow-sm text-slate-900 text-blue-600' 
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-white">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder={`Enter ${activeForm} title...`}
                        />
                    </div>

                    {(activeForm === 'news' || activeForm === 'event' || activeForm === 'study') && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {activeForm === 'news' ? 'Content' : 'Description'}
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={`Enter detailed information about the ${activeForm}...`}
                            />
                        </div>
                    )}

                    {activeForm === 'study' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Protocol ID</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.protocol_id}
                                    onChange={(e) => setFormData({ ...formData, protocol_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sponsor Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.sponsor_name}
                                    onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {activeForm === 'event' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Event Date & Time</label>
                            <input
                                required
                                type="datetime-local"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                        </div>
                    )}

                    {activeForm === 'news' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                        placeholder="https://example.com/image.png"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="success_story_toggle"
                                    checked={formData.is_success_story}
                                    onChange={(e) => setFormData({ ...formData, is_success_story: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <div>
                                    <label htmlFor="success_story_toggle" className="font-semibold text-slate-800">
                                        Mark as Success Story
                                    </label>
                                    <p className="text-xs text-slate-500">
                                        This will feature the news article prominently in the Success Stories module.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 group disabled:opacity-70"
                        >
                            {submitting ? 'Submitting...' : 'Submit Content'}
                            {!submitting && <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
