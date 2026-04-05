import React, { useState, useRef } from 'react';
import { MousePointer2, ShieldCheck, CheckCircle, ShieldAlert } from 'lucide-react';
import { COLORS, COMPREHENSION_QUESTIONS, ConsentTemplate } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface ParticipantSignViewProps {
    activeConsent: ConsentTemplate | undefined;
    setActiveView: (view: string) => void;
    addToast: (msg: string, type?: string) => void;
}

export const ParticipantSignView: React.FC<ParticipantSignViewProps> = ({ 
    activeConsent, 
    setActiveView, 
    addToast 
}) => {
    const [participantSignStep, setParticipantSignStep] = useState(1);
    const [hasScrolledFull, setHasScrolledFull] = useState(false);
    const [participantAgreements, setParticipantAgreements] = useState({ read: false, questions: false, voluntary: false });
    const [comprehensionAnswers, setComprehensionAnswers] = useState<Record<string, string>>({});
    const [participantSigned, setParticipantSigned] = useState(false);
    const participantScrollRef = useRef<HTMLDivElement>(null);

    const S = {
        title: { fontSize: '22px', fontWeight: 900 as const, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900 as const, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900 as const, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
    };

    if (!activeConsent) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#060a14] text-slate-500">
            <ShieldAlert size={80} className="opacity-10 mb-8" />
            <h3 style={S.title}>No Protocol Selected</h3>
        </div>
    );

    return (
        <div 
            className="flex-1 min-h-[1000px] bg-[#060a14] overflow-y-auto custom-scrollbar flex flex-col items-center p-6 lg:p-20" 
            ref={participantScrollRef} 
            onScroll={(e: React.UIEvent<HTMLDivElement>) => { 
                const target = e.target as HTMLDivElement;
                if (target.scrollHeight - target.scrollTop < target.clientHeight + 50) setHasScrolledFull(true); 
            }}
        >
            <div className="w-full max-w-[900px] flex flex-col gap-12 lg:gap-16">
                {/* PREVIEW BANNER */}
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm">
                    <ShieldCheck size={20} /> PREVIEW MODE ONLY — NO DATA WILL BE SAVED
                </div>

                <div className="flex gap-2 lg:gap-3 mb-8 lg:mb-12">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`flex-1 h-2 rounded-full transition-all duration-500 ${s < participantSignStep ? 'bg-emerald-500' : s === participantSignStep ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    ))}
                </div>

                {participantSignStep === 1 && (
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                        <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Protocol Review</h2>
                        <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-10 lg:mb-16">
                            Please read the following <span className="text-white font-black italic">{activeConsent?.title}</span> document in its entirety before proceeding to the signature step.
                        </p>
                        <div 
                            className="p-8 lg:p-16 bg-white rounded-3xl h-[600px] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50 text-slate-800 relative"
                            onScroll={(e) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                if (scrollTop + clientHeight >= scrollHeight - 50) {
                                    if (!hasScrolledFull) {
                                        setHasScrolledFull(true);
                                        addToast('Full protocol review verified', 'success');
                                    }
                                }
                            }}
                        >
                            <div className="space-y-12">
                                <div className="text-center pb-8 border-b border-slate-100">
                                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">{activeConsent.title}</h1>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">{activeConsent.study} • {activeConsent.irbNumber}</p>
                                </div>
                                <section>
                                    <h3 className="text-xl font-black uppercase italic mb-4">1.0 Study Purpose</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        The purpose of this clinical trial is to evaluate the efficacy of the experimental protocol. You are being asked to participate voluntarily.
                                    </p>
                                </section>
                                <section>
                                    <h3 className="text-xl font-black uppercase italic mb-4">2.0 Potential Risks</h3>
                                    <p className="text-slate-600 leading-relaxed mb-4">
                                        While the protocol is continually monitored, some participants may experience unknown risks.
                                    </p>
                                </section>
                                <section>
                                    <h3 className="text-xl font-black uppercase italic mb-4">3.0 Ethical Safeguards</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Your participation is 100% voluntary. You may withdraw at any time for any reason. Your clinical data will be de-identified and stored securely.
                                    </p>
                                </section>
                                <div className="h-[200px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center gap-4">
                                    <ShieldCheck size={40} className="text-indigo-200" />
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Authenticated Regulatory Node</p>
                                        <p className="text-slate-300 text-[11px] italic">Verified IRB Approval Stamp: {activeConsent.irbApprovalDate}</p>
                                    </div>
                                </div>

                                <div className="relative border border-slate-200 bg-slate-50 shadow-sm p-4 w-full">
                                    <PDFPage pageNumber={1} width="100%" placedFields={activeConsent?.placedFields || []} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-12 lg:mt-16">
                            <button 
                                style={{ ...S.btnIndigo, padding: '1.5rem 4rem' }} 
                                disabled={!hasScrolledFull && activeConsent?.completionRules.mustScrollFull}
                                onClick={() => setParticipantSignStep(2)}
                                className={`transition-transform shadow-2xl shadow-indigo-500/20 ${(!hasScrolledFull && activeConsent?.completionRules.mustScrollFull) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {hasScrolledFull ? 'I HAVE READ THE FULL PROTOCOL' : 'SCROLL TO BOTTOM TO CONTINUE'}
                            </button>
                        </div>
                    </div>
                )}

                {participantSignStep === 2 && (
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                        <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Confirm Understanding</h2>
                        <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-16">Please verify the following clinical prerequisites to continue.</p>
                        <div className="flex flex-col gap-5 lg:gap-6">
                            {[
                                { k: 'read', l: 'I have read and understood this consent form' },
                                { k: 'questions', l: 'I had the opportunity to ask questions and receive answers' },
                                { k: 'voluntary', l: 'I agree to participate voluntarily and may withdraw at any time' }
                            ].map(item => (
                                <div 
                                    key={item.k} 
                                    onClick={() => setParticipantAgreements({ ...participantAgreements, [item.k]: !participantAgreements[item.k as keyof typeof participantAgreements] })} 
                                    className={`p-6 lg:p-8 bg-white/[0.02] rounded-3xl border transition-all cursor-pointer flex items-center gap-6 lg:gap-8 ${participantAgreements[item.k as keyof typeof participantAgreements] ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' : 'border-white/10'}`}
                                >
                                    {participantAgreements[item.k as keyof typeof participantAgreements] ? (
                                        <CheckCircle size={32} className="text-indigo-400 shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-xl border-2 border-slate-600 shrink-0" />
                                    )}
                                    <span className="text-lg lg:text-xl font-bold text-white">{item.l}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                            <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(1)}>Back</button>
                            <button 
                                style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                disabled={!participantAgreements.read || !participantAgreements.questions || !participantAgreements.voluntary} 
                                onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 4)}
                                className={`shadow-2xl shadow-indigo-500/20 ${(!participantAgreements.read || !participantAgreements.questions || !participantAgreements.voluntary) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                CONTINUE TO {activeConsent?.completionRules.mustAnswerComprehension ? 'QUIZ' : 'SIGNING'}
                            </button>
                        </div>
                    </div>
                )}

                {participantSignStep === 3 && (
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem]">
                        <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Comprehension Check</h2>
                        <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-16">Ensure your safety by answering these protocol-specific questions.</p>
                        <div className="flex flex-col gap-10 lg:gap-12">
                            {COMPREHENSION_QUESTIONS.map(q => (
                                <div key={q.id}>
                                    <p className="text-xl lg:text-2xl font-black text-white italic mb-6 lg:mb-8">{q.question}</p>
                                    <div className="flex flex-col gap-4">
                                        {q.options.map(opt => (
                                            <div 
                                                key={opt} 
                                                onClick={() => setComprehensionAnswers({ ...comprehensionAnswers, [q.id]: opt })} 
                                                className={`p-6 bg-white/[0.01] border rounded-2xl cursor-pointer text-lg font-bold transition-all ${comprehensionAnswers[q.id] === opt ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/5 text-slate-400 hover:border-white/20'}`}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                            <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(2)}>Back</button>
                            <button 
                                style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                onClick={() => { 
                                    if(Object.keys(comprehensionAnswers).length === COMPREHENSION_QUESTIONS.length) setParticipantSignStep(4); 
                                    else addToast('Please answer all questions', 'warning'); 
                                }}
                                className="shadow-2xl shadow-indigo-500/20 hover:scale-[1.02]"
                            >
                                CHECK ANSWERS & CONTINUE
                            </button>
                        </div>
                    </div>
                )}

                {participantSignStep === 4 && (
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] text-center">
                        <h2 style={{ ...S.title, fontSize: '32px', marginBottom: '1.5rem' }}>Electronic Authorization</h2>
                        <p className="text-slate-400 text-lg lg:text-xl mb-12 lg:mb-20">Applying your signature constitutes a legally binding agreement to participate in clinical research.</p>
                        <div 
                            className={`h-[400px] bg-white rounded-[2rem] flex flex-col items-center justify-center border-4 border-dashed transition-all cursor-pointer shadow-inner ${participantSigned ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`} 
                            onClick={() => setParticipantSigned(true)}
                        >
                            {participantSigned ? (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="font-['Yellowtail'] text-7xl lg:text-8xl text-indigo-900 drop-shadow-lg">Test Participant</div>
                                    <span style={S.badge(COLORS.success)} className="scale-125"><CheckCircle size={18} /> SIGNATURE APPLIED (PREVIEW)</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 text-slate-300">
                                    <MousePointer2 size={64} className="animate-bounce" />
                                    <div className="text-2xl font-black uppercase tracking-[0.2em] italic">CLICK HERE TO SIGN</div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 mt-16 lg:mt-24">
                            <button style={{ ...S.btnGhost, flex: 1, padding: '1.5rem' }} onClick={() => setParticipantSignStep(activeConsent?.completionRules.mustAnswerComprehension ? 3 : 2)}>Back</button>
                            <button 
                                style={{ ...S.btnIndigo, flex: 2, padding: '1.5rem' }} 
                                disabled={!participantSigned} 
                                onClick={() => setParticipantSignStep(5)}
                                className={`shadow-2xl shadow-indigo-500/20 ${participantSigned ? 'hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                REVIEW FOR SUBMISSION
                            </button>
                        </div>
                    </div>
                )}

                {participantSignStep === 5 && (
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 lg:p-24 rounded-[2.5rem] lg:rounded-[3.5rem] text-center flex flex-col items-center gap-10">
                        <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500 shadow-2xl shadow-emerald-500/20">
                            <ShieldCheck size={64} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 style={{ ...S.title, fontSize: '40px', marginBottom: '1.5rem' }}>Protocol Ready (Preview)</h2>
                            <p className="text-slate-400 text-xl leading-relaxed">Your signed consent <span className="text-white font-bold">v{activeConsent?.version}</span> is ready for submission to the PI for final verification.</p>
                            <p className="text-amber-500 mt-4 text-sm font-bold uppercase tracking-widest">THIS IS A PREVIEW - NO DATA RECORDED</p>
                        </div>
                        <button 
                            style={{ ...S.btnIndigo, width: '100%', padding: '1.75rem', backgroundColor: COLORS.success }} 
                            onClick={() => { setActiveView('builder'); addToast('Exit preview mode successfully', 'success'); }}
                            className="shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                        >
                            EXIT PREVIEW MODE
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
