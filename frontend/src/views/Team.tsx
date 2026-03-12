import React, { useState } from 'react';
import { Linkedin, ChevronDown, ChevronUp, Building2, Users, Stethoscope, Briefcase, Activity, FileText, ShieldCheck } from 'lucide-react';

const LEADERSHIP_DATA = [
    {
        name: "Dr. Shalini Jain",
        role: "CEO and Co-Founder",
        bio: "Dr. Shalini Jain, CEO and Co-Founder of MusB Research, is a seasoned translational scientist with over 24 years of experience in biotics, functional foods, and microbiome research. Her scientific expertise integrates basic science, mechanistic biology, and clinical translation to transform laboratory discoveries into real-world health solutions.",
        expanded_bio: "Dr. Shalini Jain is CEO and Co-Founder of MusB Research and a seasoned translational scientist with more than 24 years of experience in biotics, functional foods, and microbiome research. She received her training from the National Dairy Research Institute and conducted advanced research at globally respected institutions including the University of Illinois Urbana-Champaign, the US National Institutes of Health (NIH), Wake Forest School of Medicine, and USF Morsani College of Medicine.\n\nHer scientific expertise spans microbiome science, immunology, brain health, women’s health, cancer, metabolic disorders, diabetes, obesity, nutrition, and environmental toxicants. Dr. Jain has led multidisciplinary research programs integrating basic science, mechanistic biology, and clinical translation.\n\nShe is deeply committed to transforming laboratory discoveries into real-world health solutions. With a strong vision for industry collaboration, she has built MusB Research as a high-quality scientific platform that supports rigorous, evidence-based validation of natural products. Her goal is to position MusB Research as an extended R&D arm for industry partners, ensuring scientific excellence, regulatory readiness, and strong consumer confidence.",
        image: "/images/team/shalini_jain.webp",
        linkedin_url: "https://www.linkedin.com/in/shaliniscientist/",
        expertise_tags: ["Microbiome Science", "Immunology", "Clinical Translation", "Biotics"],
        areas_of_expertise: [
            "Microbiome Science", "Immunology", "Brain Health", "Women's Health",
            "Cancer", "Metabolic Disorders", "Diabetes", "Obesity", "Nutrition", "Environmental Toxicants"
        ],
        affiliations: [
            "National Dairy Research Institute",
            "University of Illinois Urbana-Champaign",
            "National Institutes of Health (NIH)",
            "Wake Forest School of Medicine",
            "USF Morsani College of Medicine"
        ],
        publications: []
    },
    {
        name: "Dr. Hariom Yadav",
        role: "Co-Founder",
        bio: "Dr. Hariom Yadav, Co-Founder of MusB Research, is a globally recognized translational scientist with over 25 years of transformative experience in microbiome and biotics research. His work centers on translating cutting-edge discoveries into clinically validated solutions for metabolic health, longevity, and the gut–brain axis.",
        expanded_bio: "Dr. Hariom Yadav is Co-Founder of MusB Research and a globally recognized translational scientist with more than 25 years of transformative experience in microbiome and biotics research. He has been trained and conducted research at world-renowned institutions including the US National Institutes of Health (NIH), Wake Forest School of Medicine, and USF Morsani College of Medicine. His work centers on translating cutting-edge discoveries into clinically validated solutions for metabolic health, longevity, and the gut–brain axis.\n\nDr. Yadav has led pioneering programs investigating probiotics and postbiotics in aging biology, metabolic disorders, cognitive decline, leaky gut, and systemic inflammation (inflammaging). His expertise supports a rigorous, evidence-based scientific platform for the validation of natural products, positioning MusB Research as an extended R&D arm for industry partners, ensuring scientific excellence, regulatory readiness, and strong consumer confidence.",
        image: "/images/team/hariom_yadav.webp",
        linkedin_url: "https://www.linkedin.com/in/yadavhariom/",
        expertise_tags: ["Microbiome", "Metabolic Health", "Longevity", "Gut-Brain Axis"],
        areas_of_expertise: [
            "Microbiome Research", "Probiotics & Postbiotics", "Aging Biology",
            "Metabolic Disorders", "Cognitive Decline", "Leaky Gut", "Systemic Inflammation"
        ],
        affiliations: [
            "National Institutes of Health (NIH)",
            "Wake Forest School of Medicine",
            "USF Morsani College of Medicine"
        ],
        publications: []
    }
];

const ADVISORS_DATA = [
    {
        name: "Douglas Lynch",
        advisory_role: "Business Development Advisory Board Member",
        expertise_area: "Sales & Marketing",
        organization: "Organic and Natural Health Association",
        bio: "DOUGLAS LYNCH is an award-winning, global sales/marketing executive with over three decades of experience commercializing supplements, functional foods, medical foods, cosmeceuticals, animal health, and proprietary bioactive ingredients. He combines C-suite, omni-channel sales and marketing leadership, with IP-portfolio management expertise. Douglas has developed hundreds of consumer products for global markets. An entrepreneur, Douglas partners with universities, public and private entities to develop non-pharmaceutical solutions for age-related conditions. Douglas advises multinationals and start-ups on sales and marketing tactics. He’s a frequent, global speaker on consumer trends, and serves on the board of the Organic and Natural Health Association in Washington, D.C.",
        image: "/images/team/dougla_lynch.webp",
        linkedin_url: "https://www.linkedin.com/in/marketwellnutritionceo/"
    },
    {
        name: "NAGENDRA RANGAVAJLA, Ph.D., FACN",
        advisory_role: "Business Development Advisory Board Member",
        expertise_area: "R&D Strategy & Innovation",
        organization: "Former Abbott / Nestlé Executive",
        bio: "Nagendra Rangavajla, Ph.D., FACN, is a strategic R&D leader with over 25 years of experience driving innovation from discovery to commercialization for global CPG leaders like Abbott, Nestlé, and Mead Johnson, as well as high-growth startups like Califia Farms and one.bio. He specializes in building robust science and technology roadmaps that link consumer insights to differentiated products across functional ingredients, beverages, and nutritional categories. His expertise spans the entire lifecycle of innovation, from ingredient scouting and bioconversion to managing complex clinical efficacy studies and global regulatory strategies.\n\nAs a seasoned advisor, Nagendra has expertise in scaling R&D operations, having optimized organizational processes to increase speed, productivity and innovation culture. He is a prolific innovator with over 20 patents and 50 publications, particularly in the areas of gut health, cognition, metabolic wellness, etc., and leverages a deep network of academic and external partners to help emerging companies navigate the transition from discovery to global distribution.",
        image: "/images/team/nagendra_rangavajla.webp",
        linkedin_url: "https://www.linkedin.com/in/nagendra-rangavajla-053584/"
    },
    {
        name: "Peter As Alphonse",
        advisory_role: "Business Development Advisory Board Member",
        expertise_area: "Scientific & Regulatory Affairs",
        organization: "Stelioz Solutions Inc.",
        bio: "Peter Alphonse, PhD, CFS\nScientific and Regulatory Affairs Consultant, Stelioz Solutions Inc.\n\nDr. Peter Alphonse is the Scientific and Regulatory Affairs Consultant at Stelioz Solutions Inc., a specialized consultancy serving the natural health product, nutraceutical, dietary supplement, functional food, and veterinary health product sectors. He provides comprehensive regulatory and scientific leadership, supporting companies from early-stage concept development through successful market commercialization in Canada and the United States.\n\nAt Stelioz Solutions Inc., (www.steliozsolutions.com) Dr. Alphonse leads Health Canada NPN and site license applications, FDA food and dietary supplement compliance, GMP and quality systems implementation, labeling and packaging review, and SFCR licensing. The firm also offers clinical research strategy, scientific and technical writing, health claim substantiation, formulation development, analytical testing guidance, and regulatory pathway planning.\n\nWith a PhD in Human Nutritional Sciences and extensive experience in regulatory affairs, research, and product innovation, Dr. Alphonse is committed to advancing science-based wellness solutions that meet the highest standards of quality, safety, and compliance.",
        image: "/images/team/peter_alphonse.webp",
        linkedin_url: ""
    },
    {
        name: "Sean M. Garvey, Ph.D",
        advisory_role: "Business Development Advisory Board Member",
        expertise_area: "Nutritional Science & Business Development",
        organization: "Strategic Advisor",
        bio: "Sean Garvey, PhD, is an R&D and innovation leader with more than 25 years of experience spanning academia, medical nutrition, therapeutics, and B2B probiotics and enzymes, with a strong focus on microbiome and gut health. He brings deep expertise in clinical and preclinical research, scientific affairs, and strategic partnerships, with a track record that includes 34 peer‑reviewed publications, multiple patents, and successful leadership of enzyme and probiotic clinical trials supporting commercial product launches. As President and Founder of SAPIOME LLC, Dr. Garvey now advises nutraceutical and “-biotics” companies on pipeline strategy, external innovation, and evidence generation, experience he applies in his role on the Business Development Advisory Board of MusB Research to help sponsors design rigorous studies and unlock the commercial value of microbiome, gut health, and longevity innovations.",
        image: "/images/team/sean_m_garvey.webp",
        linkedin_url: "https://www.linkedin.com/in/sean-garvey-phd-638a253/"
    },
    {
        name: "Dr. Paulo Binetti",
        advisory_role: "Business Development Advisory Board Member",
        expertise_area: "Bioengineering & Venture Finance",
        organization: "VitaDAO / LongGame",
        bio: "Paolo Binetti is one of the top contributors of VitaDAO, a web3 organization funding longevity drug discovery. He is also an advisor for LongGame, a longevity biotech VC, a venture fellow for Healthspan Capital, another longevity biotech VC, as well as a biotech expert for Capital Cell, a crowd equity platform. Previously he held positions in strategy, business development, portfolio management, and program management, in industry and government.\n\nBorn and raised in Milano, Italy, Paolo holds a PhD in controls, robotics and bioengineering from the University of Pisa, a MS in aerospace engineering from Politecnico di Milano, a specialization in bioinformatics from the University of California San Diego, a certificate in drug discovery and development from Harvard Medical School, and a certificate in venture finance from the University of Oxford.",
        image: "/images/team/Paulo Binetti Image.webp",
        linkedin_url: "https://www.linkedin.com/in/paolo-binetti-1a3a991/"
    }
];

const COLLABORATORS_DATA = [
    { id: 1, name: 'Tampa General Hospital', specialty: 'Multi-Specialty Research', location: 'Tampa, FL', logo: '' },
    { id: 2, name: 'Moffitt Cancer Center', specialty: 'Oncology', location: 'Tampa, FL', logo: '' },
    { id: 3, name: 'USF Health', specialty: 'Academic Research', location: 'Tampa, FL', logo: '' },
    { id: 4, name: 'Bay Area Gastroenterology', specialty: 'Gastroenterology', location: 'St. Petersburg, FL', logo: '' },
    { id: 5, name: 'Florida Neurology Associates', specialty: 'Neurology', location: 'Tampa Bay Area', logo: '' },
    { id: 6, name: "Women's Health Specialists", specialty: "Women's Health", location: 'Clearwater, FL', logo: '' },
];

const STAFF_DATA = [
    { name: "Ms. Vaishnavi S", role: "Business & Administration Manager", dept: "Operations" },
    { name: "Mr. Indushekar Manjunatha", role: "Clinical Coordinator", dept: "Clinical Research" },
    { name: "Mrs. Falguni Kanani", role: "Community Outreach Liaison", dept: "Public Relations" },
    { name: "Mr. Alain Ramirez", role: "Laboratory Technician", dept: "Lab Services" },
    { name: "Dr. Andreas Mbah", role: "Medical Laboratory Director", dept: "Diagnostics" },
    { name: "Mr. Jason Chandler", role: "IT Professional", dept: "Technology" },
    { name: "Mr. Shray Paliwal", role: "Research Intern", dept: "Scientific Support" },
    { name: "Dr. Osula Ebiuwa", role: "Research Intern", dept: "Scientific Support" },
    { name: "Mr. Barenya Prasad Mishra", role: "Digital Health Platform Developer", dept: "Product Engineering" },
    { name: "Mr. Brijesh Kumar", role: "Junior Software Engineer", dept: "Software Development" }
];


const TeamMemberCard = ({ member }: { member: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/10 overflow-hidden hover:border-cyan-400/50 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left flex-1 min-h-[320px]">
                {/* Headshot */}
                <div className="flex-shrink-0 relative md:ml-4">
                    <div className="w-40 h-52 md:w-48 md:h-64 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {member.image ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                className={`w-full h-full object-cover ${member.name.includes('Shalini') ? 'object-[50%_35%]' : member.name.includes('Hariom') ? 'object-[50%_25%]' : ''}`}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
                                <Users className="w-12 h-12 text-slate-700 mb-2" />
                                <span className="text-slate-400 font-black text-4xl">{member.name.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full space-y-3">
                    <div className="space-y-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h3 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">{member.name}</h3>
                            {member.linkedin_url && (
                                <a
                                    href={member.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 rounded-lg border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all self-center md:self-auto"
                                    aria-label="LinkedIn Profile"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                        <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> {member.role}
                        </p>
                    </div>

                    <p className="text-slate-400 text-base leading-relaxed line-clamp-3">{member.bio}</p>

                    {/* Expertise Tags */}
                    {member.expertise_tags && (
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {member.expertise_tags.slice(0, 4).map((tag: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-2.5 py-1 text-[10px] font-black bg-cyan-400/10 text-cyan-400 rounded-lg border border-cyan-400/20 uppercase tracking-tighter"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Accordion Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/10 group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-slate-500 group-hover:text-cyan-400'}`}>
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">
                        {isOpen ? 'Close Full Bio' : 'View Full Bio & Publications'}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-cyan-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                )}
            </button>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-8 md:p-10 bg-black/20 border-t border-white/5 space-y-10 animate-in slide-in-from-top-2 duration-300">
                    {/* Expanded Bio Text */}
                    {member.expanded_bio && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/50">Professional Background</h4>
                            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm lg:text-base">
                                <p className="whitespace-pre-line">{member.expanded_bio}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Areas of Expertise */}
                        {member.areas_of_expertise && member.areas_of_expertise.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                    <Activity className="w-4 h-4" /> Expertise
                                </h4>
                                <ul className="space-y-2.5">
                                    {member.areas_of_expertise.map((area: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-400 text-xs lg:text-sm font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1.5 flex-shrink-0"></div>
                                            {area}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Affiliations */}
                        {member.affiliations && member.affiliations.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                    <Building2 className="w-4 h-4" /> Affiliations
                                </h4>
                                <ul className="space-y-2.5">
                                    {member.affiliations.map((aff: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-400 text-xs lg:text-sm font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1.5 flex-shrink-0"></div>
                                            {aff}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Publications */}
                    {member.publications && member.publications.length > 0 && (
                        <div className="space-y-6 pt-8 border-t border-white/10">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                <FileText className="w-4 h-4" /> Key Publications
                            </h4>
                            <div className="grid gap-4">
                                {member.publications.map((pub: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <span className="text-cyan-500/30 font-black text-xl leading-none">0{idx + 1}</span>
                                        <p className="text-slate-400 text-xs lg:text-sm italic leading-relaxed">{pub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AdvisorCard = ({ advisor }: { advisor: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/10 overflow-hidden hover:border-indigo-400/50 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start flex-1">
                {/* Left Side: Portrait Image */}
                <div className="flex-shrink-0 relative md:ml-4">
                    <div className="w-40 h-52 md:w-44 md:h-56 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {advisor.image ? (
                            <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
                                <Users className="w-10 h-10 text-slate-700 mb-2" />
                                <span className="text-slate-400 font-black text-3xl">{advisor.name.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tight uppercase whitespace-pre-line">{advisor.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-tight">
                            {advisor.advisory_role}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Expertise</span>
                            <span className="px-3 py-1 text-[10px] font-black bg-indigo-400/10 text-indigo-400 rounded-lg border border-indigo-400/20 uppercase tracking-tight inline-block">
                                {advisor.expertise_area}
                            </span>
                        </div>

                        {advisor.organization && (
                            <div className="space-y-1.5 text-left">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Organization</span>
                                <p className="text-sm text-slate-300 font-bold tracking-tight">{advisor.organization}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Accordion Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/10 group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-400/20 text-indigo-400' : 'bg-white/5 text-slate-500 group-hover:text-indigo-400'}`}>
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors text-sm">
                        {isOpen ? 'Close Bio' : 'View Profile & Bio'}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                )}
            </button>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-8 bg-black/20 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm">
                        <p className="whitespace-pre-line">{advisor.bio}</p>
                    </div>

                    {advisor.linkedin_url && (
                        <div className="pt-2 flex justify-start">
                            <a
                                href={advisor.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-widest">LinkedIn Profile</span>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Team() {


    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* ... Background & Hero ... */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-10 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Title + Intro */}
                        <div className="space-y-8 text-left max-w-2xl">
                            <div className="space-y-4">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-bold tracking-wider uppercase">
                                    Scientific Leadership
                                </span>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9]">
                                    Our <span className="text-cyan-400">Team</span>
                                </h1>
                            </div>

                            <div className="space-y-6 text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                <p>A multidisciplinary team of scientists, clinicians, and professionals dedicated to advancing translational and clinical research.</p>
                                <p className="text-slate-400 border-l-4 border-cyan-400/30 pl-6 italic">Built on academic rigor, regulatory excellence, and community engagement.</p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-bold text-slate-400">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    Multidisciplinary
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-bold text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                    Evidence-Driven
                                </div>
                            </div>
                        </div>

                        {/* Right: Subtle visual element */}
                        <div className="relative hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-[3rem] blur-3xl opacity-50 animate-pulse"></div>
                            <div className="relative aspect-square rounded-[3rem] border-2 border-white/10 overflow-hidden shadow-2xl group">
                                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors duration-700"></div>
                                <img
                                    src="/api/placeholder/800/800"
                                    alt="Scientific Team Visual"
                                    className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 border border-cyan-400/20 rounded-full flex items-center justify-center animate-spin-slow">
                                        <div className="w-32 h-32 border border-indigo-400/20 rounded-full flex items-center justify-center animate-reverse-spin">
                                            <div className="w-24 h-24 border border-purple-400/20 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 p-6 backdrop-blur-md bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-400/20 flex items-center justify-center text-cyan-400">
                                            <Stethoscope className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">Expert-Led</p>
                                            <p className="text-slate-400 text-sm">Regulatory Excellence</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 1: Leadership & Scientific Team */}
            <section id="leadership" className="relative z-10 pt-6 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Leadership <span className="text-cyan-400">&</span> Scientific Team
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                Expert authority established through decades of clinical rigor and scientific innovation. Ideal for sponsors, CROs, and regulators.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            Featured Profiles
                        </div>
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {LEADERSHIP_DATA.map((member, index) => (
                            <TeamMemberCard key={index} member={member} />
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 2: Advisors */}
            <section id="advisors" className="relative z-10 pt-6 pb-20 px-6 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Advisory <span className="text-indigo-400">Board</span>
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                Industry leaders and domain experts providing strategic guidance for global research excellence.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                            Strategic Counsel
                        </div>
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {ADVISORS_DATA.map((advisor, index) => (
                            <AdvisorCard key={index} advisor={advisor} />
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3: Clinical Collaborators */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Clinical <span className="text-purple-400">Collaborators</span>
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                A scalable network of specialized institutions and clinics highlighting our translational research strength and sponsor-ready infrastructure.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                            Network Strength
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {COLLABORATORS_DATA.map((collaborator) => (
                            <div
                                key={collaborator.id}
                                className="group bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-center"
                            >
                                {/* Logo Placeholder */}
                                <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                    {collaborator.logo ? (
                                        <img src={collaborator.logo} alt={collaborator.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-purple-400" />
                                    )}
                                </div>

                                {/* Name & Specialty */}
                                <h3 className="text-lg font-black text-white leading-tight mb-2">{collaborator.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">{collaborator.specialty}</p>
                                {collaborator.location && (
                                    <p className="text-xs text-slate-400 font-medium">{collaborator.location}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 4: Staff */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Operational <span className="text-cyan-400">Staff</span>
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                The dedicated professionals ensuring operational excellence, regulatory compliance, and seamless execution in every study.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            Execution Excellence
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {STAFF_DATA.map((staff, idx) => (
                            <div
                                key={idx}
                                className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border-2 border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden h-full"
                            >
                                {/* Decorative Gradient Blobs */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full -translate-y-12 translate-x-12 group-hover:bg-cyan-500/10 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full translate-y-12 -translate-x-12 group-hover:bg-indigo-500/10 transition-colors"></div>

                                {/* Staff Info */}
                                <div className="space-y-3 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-cyan-400 transition-colors underline decoration-cyan-400/0 group-hover:decoration-cyan-400/30 underline-offset-4">
                                            {staff.name}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/70 py-1">
                                            {staff.role}
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 group-hover:border-white/20 transition-all">
                                            {staff.dept}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
