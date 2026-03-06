import React, { useState, useRef, useEffect } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Building2,
    Microscope,
    Users2,
    MessageSquare,
    ShieldCheck,
    Zap,
    Target,
    ChevronRight,
    Send,
    Check,
    MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { submitContactForm } from '../api';

const defaultInquiryTypes = [
    { value: 'business', label: 'Business / Sponsorship' },
    { value: 'research', label: 'Research Collaboration' },
    { value: 'lab', label: 'Central Laboratory Services' },
    { value: 'biorepository', label: 'Biorepository' },
    { value: 'participation', label: 'Clinical Study Participation' },
    { value: 'careers', label: 'Careers' },
    { value: 'general', label: 'General Inquiry' }
];

const contactCards = [
    {
        id: 'business',
        title: 'For Businesses & Sponsors',
        desc: 'Research, lab services, biorepository, partnerships',
        cta: 'Contact Sales',
        icon: Building2,
        color: 'cyan'
    },
    {
        id: 'research',
        title: 'For Research Collaboration',
        desc: 'Academic and industry research inquiries',
        cta: 'Talk to a Scientist',
        icon: Microscope,
        color: 'indigo'
    },
    {
        id: 'participation',
        title: 'For Study Participation',
        desc: 'Join a clinical research study',
        cta: 'Join a Study',
        icon: Users2,
        color: 'blue'
    },
    {
        id: 'general',
        title: 'General Inquiries',
        desc: 'All other questions and general information',
        cta: 'Get in Touch',
        icon: MessageSquare,
        color: 'slate'
    }
];

const trustPoints = [
    { title: 'Science-led Design', desc: 'Mission-driven organization led by world-class scientists.', icon: Target },
    { title: 'Expert Team', desc: 'Work with renowned clinicians and research specialists.', icon: Zap },
    { title: 'Integrated Services', desc: 'Seamless research, lab, and biorepository ecosystem.', icon: Microscope },
    { title: 'Ethical Operations', desc: 'Fully compliant, transparent, and IRB-aligned conduct.', icon: ShieldCheck }
];

export default function Contact() {
    const [inquiryType, setInquiryType] = useState('general');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inquiryTypes, setInquiryTypes] = useState(defaultInquiryTypes);
    const formRef = useRef<HTMLDivElement>(null);

    const handleCardClick = (id: string) => {
        setInquiryType(id);
        if (formRef.current) { window.scrollTo({ top: formRef.current.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' }); }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        const form = e.currentTarget;
        const formDataObj = new FormData(form);

        const formData = {
            name: formDataObj.get('name') as string,
            email: formDataObj.get('email') as string,
            phone: formDataObj.get('phone') as string,
            company: formDataObj.get('company') as string,
            message: formDataObj.get('message') as string,
            inquiry_type_slug: inquiryType,
        };

        try {
            setIsSubmitting(true);
            await submitContactForm(formData);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 5000);
            form.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to send message. Please try again later or contact us directly at info@musbresearch.com');
        } finally {
            setIsSubmitting(false);
        }

    };


    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
            </div>

            {/* SECTION 1: PAGE HEADER */}
            <section className="relative pt-40 pb-20 overflow-hidden px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>
                <div className="max-w-[1700px] mx-auto relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
                        Contact Us
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        We’re here to help. Reach out to discuss research collaborations, laboratory services, biorepository support, or participation in our clinical studies.
                    </p>
                </div>
            </section>

            {/* SECTION 2: CONTACT OPTIONS */}
            <section className="max-w-[1700px] mx-auto px-6 md:px-12 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {contactCards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="group bg-white/5 border border-white/5 p-8 md:p-10 rounded-[3rem] text-left hover:bg-slate-900 transition-all duration-500 shadow-xl relative overflow-hidden h-full flex flex-col items-start"
                        >
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400/5 blur-3xl group-hover:bg-cyan-400/10 transition-colors"></div>
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all mb-8 shadow-lg">
                                <card.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-white leading-tight uppercase group-hover:text-cyan-400 transition-colors italic mb-4">{card.title}</h3>
                            <p className="text-slate-400 font-semibold leading-relaxed mb-8 flex-grow">{card.desc}</p>
                            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white border-b-2 border-cyan-500 pb-1 group-hover:gap-4 transition-all group-hover:text-cyan-400">
                                {card.cta} <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* SECTION 3: CONTACT FORM & DETAILS */}
            <section ref={formRef} className="max-w-[1700px] mx-auto px-6 md:px-12 py-20 relative z-10 scroll-mt-32">
                <div className="grid lg:grid-cols-3 gap-20 items-stretch">
                    {/* LEFT COLUMN: CONTACT FORM */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase italic leading-none">
                                Send Us a Message
                            </h2>
                            <p className="text-xl text-slate-500 font-bold uppercase tracking-widest">Typical response time: 1–2 business days.</p>
                        </div>

                        {submitted ? (
                            <div className="bg-cyan-500/10 border border-cyan-500/30 p-12 rounded-[3.5rem] text-center space-y-6 animate-in zoom-in-95">
                                <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center mx-auto text-slate-950">
                                    <Check className="w-10 h-10 stroke-[3]" />
                                </div>
                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tight">Message Received</h3>
                                <p className="text-xl text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                                    Thank you for contacting MusB™ Research. Our team will review your message and respond shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="bg-slate-900/40 backdrop-blur-3xl p-6 md:p-16 rounded-[4.5rem] border border-white/5 space-y-10 shadow-2xl">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Full Name *</label>
                                        <input required name="name" type="text" placeholder="John Doe" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Email Address *</label>
                                        <input required name="email" type="email" placeholder="john@example.com" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Phone Number (Optional)</label>
                                        <input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Inquiry Type *</label>
                                        <select
                                            value={inquiryType}
                                            onChange={(e) => setInquiryType(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all appearance-none"
                                        >
                                            {inquiryTypes.map(opt => (
                                                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {inquiryType === 'participation' && (
                                    <div className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-2">
                                        <p className="text-slate-300 font-bold">Ready to find a study near you?</p>
                                        <Link to="/trials" className="bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all flex items-center gap-2">
                                            Find a clinical study <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}

                                {(inquiryType === 'business' || inquiryType === 'research' || inquiryType === 'lab' || inquiryType === 'biorepository') && (
                                    <div className="space-y-6 p-8 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Areas of Interest</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {['Research & Innovation', 'Central Laboratory', 'Biorepository'].map((area) => (
                                                <label key={area} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative w-6 h-6 border-2 border-slate-700 rounded-lg group-hover:border-cyan-500 transition-colors">
                                                        <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer peer" />
                                                        <Check className="w-full h-full text-cyan-400 scale-0 peer-checked:scale-100 transition-transform" />
                                                    </div>
                                                    <span className="text-slate-400 font-bold uppercase text-xs group-hover:text-white transition-colors">{area}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Organization / Company (Optional)</label>
                                    <input name="company" type="text" placeholder="Company Name" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all" />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">Message *</label>
                                    <textarea name="message" required rows={5} placeholder="How can we help your program succeed?" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white transition-all resize-none"></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full ${isSubmitting ? 'bg-slate-700' : 'bg-cyan-500'} text-slate-950 py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-3`}
                                >
                                    {isSubmitting ? 'Sending...' : 'Submit Inquiry'} <Send className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                    </div>

                    {/* RIGHT COLUMN: CONTACT DETAILS */}
                    <div className="space-y-16 lg:sticky lg:top-32 h-fit">
                        <div className="space-y-12 bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tight">Get in Touch</h2>

                            <div className="space-y-10">
                                <div className="flex gap-6">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shadow-lg">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Address</h4>
                                        <a
                                            href="https://www.google.com/maps/search/?api=1&query=6331+State+Road+54,+New+Port+Richey,+FL+34653"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-300 font-bold text-lg leading-relaxed hover:text-cyan-400 transition-colors block"
                                        >
                                            6331 State Road 54,<br />
                                            New Port Richey, FL 34653
                                        </a>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-lg">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Phone</h4>
                                        <a href="tel:+18134190781" className="text-slate-300 font-bold text-lg leading-none hover:text-indigo-400 transition-colors block">CALL: +1-813-419-0781</a>
                                        <a href="sms:+17275050452" className="text-slate-500 font-bold text-sm uppercase tracking-tight hover:text-indigo-400 transition-colors block">OR TEXT: (727) 505-0452</a>
                                    </div>
                                </div>

                                <div className="flex gap-6 group/wa">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 shadow-lg group-hover/wa:bg-green-500 group-hover/wa:text-slate-950 transition-all">
                                        <MessageCircle className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">WhatsApp</h4>
                                        <a
                                            href="https://wa.me/17275050452"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-400 font-black text-lg hover:text-green-300 transition-colors block"
                                        >
                                            (727) 505-0452
                                        </a>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-lg">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Email</h4>
                                        <a href="mailto:info@musbresearch.com" className="text-blue-400 font-black text-lg break-all hover:text-blue-300 transition-colors">info@musbresearch.com</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Embedded Google Map */}
                        <a
                            href="https://www.google.com/maps/place/MusB+Diagnostics/@28.2186349,-82.7088581,16z/data=!4m6!3m5!1s0x88c291e526b3babf:0x551f1e65be2161c1!8m2!3d28.217776!4d-82.7096327!16s%2Fg%2F11zj8j5wsj?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-slate-900 rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl relative group cursor-pointer hover:border-cyan-500/30 transition-all block"
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3517.8!2d-82.7096327!3d28.217776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88c291e526b3babf%3A0x551f1e65be2161c1!2sMusB%20Diagnostics!5e0!3m2!1sen!2sus!4v1709500000000!5m2!1sen!2sus"
                                width="100%"
                                height="100%"
                                style={{ border: 0, pointerEvents: 'none' }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="MusB Diagnostics Location"
                                className="absolute inset-0 w-full h-full"
                            ></iframe>
                            <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors z-10"></div>
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="bg-slate-950/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-[10px] group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all">
                                    Open Google Maps
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* SECTION 4: WHY CONTACT MUSB RESEARCH */}
            <section className="bg-slate-900/30 py-20 border-y border-white/5">
                <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {trustPoints.map((point) => (
                            <div key={point.title} className="flex flex-col items-center text-center space-y-6 group">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-500 shadow-xl">
                                    <point.icon className="w-10 h-10" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{point.title}</h3>
                                    <p className="text-slate-400 font-semibold leading-relaxed text-sm">{point.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 5: QUICK LINKS */}
            <section className="max-w-[1700px] mx-auto px-6 md:px-12 py-16 relative z-10">
                <div className="flex flex-wrap justify-center gap-6">
                    {[
                        { label: 'Find a Clinical Study', path: '/trials' },
                        { label: 'For Businesses', path: '/support' },
                        { label: 'Our Capabilities', path: '/innovations' },
                        { label: 'Careers', path: '/careers' },
                        { label: 'News & Events', path: '/news' }
                    ].map((link) => (
                        <Link
                            key={link.label}
                            to={link.path}
                            className="bg-white/5 border border-white/5 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                        >
                            {link.label} <ChevronRight className="w-4 h-4" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* SECTION 6: FINAL CTA */}
            <section className="max-w-[1700px] mx-auto px-6 md:px-12 pb-20">
                <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-cyan-600/20 backdrop-blur-3xl rounded-[4rem] p-8 md:p-20 border border-white/10 overflow-hidden relative group text-center space-y-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="space-y-6 max-w-2xl mx-auto relative z-10">
                        <h2 className="text-3xl md:text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Not sure where to start?
                        </h2>
                        <p className="text-xl font-bold text-slate-400 leading-relaxed uppercase tracking-widest">We’ll help guide you. Our experts are ready to assist.</p>
                    </div>
                    <button
                        onClick={() => handleCardClick('general')}
                        className="bg-cyan-500 text-slate-950 px-12 py-6 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 relative z-10"
                    >
                        Request a Call Back
                    </button>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-500"></div>
                </div>
            </section>
        </div>
    );
}
