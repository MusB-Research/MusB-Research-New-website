import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Clock, MousePointer2, TrendingUp, MapPin, Search, ArrowUpRight } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Visitor <span className="text-[#3b82f6]">Analytics</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Real-time global traffic and engagement metrics</p>
        </div>
        <div className="flex gap-4">
          <select className="bg-[#0f1133] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none uppercase tracking-widest">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Visitors', value: '12,482', change: '+12%', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Avg. Session', value: '4m 32s', change: '+5%', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Return Rate', value: '34.2%', change: '+8%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Conversion', value: '4.8%', change: '-2%', icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10', down: true }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f1133] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} inline-flex mb-6`}>
               <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h4 className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</h4>
              <span className={`text-[10px] font-black uppercase flex items-center mb-1 ${stat.down ? 'text-red-500' : 'text-emerald-500'}`}>
                {stat.change} <ArrowUpRight className={`w-3 h-3 ${stat.down ? 'rotate-90' : ''}`} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Visitor Traffic Simulation Chart Area */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 h-full min-h-[400px] relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Traffic Trends</h3>
               <div className="flex gap-2">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_blue]"></div><span className="text-[9px] font-black uppercase text-slate-500">Unique</span></div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_pink]"></div><span className="text-[9px] font-black uppercase text-slate-500">Returning</span></div>
               </div>
             </div>
             
             {/* Simple Simulated Chart Visualization using CSS */}
             <div className="flex items-end justify-between h-56 gap-2 sm:gap-4 px-4 border-b border-white/5 pb-2">
                {[45, 60, 40, 80, 55, 95, 70, 85, 40, 60, 90, 75, 50, 65].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-10 bg-white text-black px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity z-10">{h * 10}</div>
                    <div 
                      className="w-full bg-gradient-to-t from-blue-900/40 to-blue-500 rounded-t-lg transition-all duration-1000 group-hover:from-blue-500 group-hover:to-cyan-400 group-hover:shadow-[0_0_20px_blue]" 
                      style={{ height: `${h}%` }}
                    ></div>
                    <span className="text-[8px] font-black text-slate-700 uppercase">{8 + i}:00</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Geographic Breakdown */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-10 h-full">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-10">Top Locations</h3>
              <div className="space-y-8">
                 {[
                   { city: 'United States', visitors: '8,240', percent: 72, color: 'bg-blue-500' },
                   { city: 'Canada', visitors: '1,120', percent: 12, color: 'bg-indigo-500' },
                   { city: 'United Kingdom', visitors: '940', percent: 8, color: 'bg-emerald-500' },
                   { city: 'India', visitors: '620', percent: 5, color: 'bg-pink-500' },
                   { city: 'Others', visitors: '320', percent: 3, color: 'bg-slate-700' }
                 ].map((loc, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                         <div className="flex items-center gap-3">
                           <MapPin className="w-3 h-3 text-slate-600" />
                           <span className="text-white italic">{loc.city}</span>
                         </div>
                         <span className="text-slate-500">{loc.visitors}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${loc.percent}%` }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className={`h-full ${loc.color}`}
                        ></motion.div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <div className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em] border-b border-white/5 pb-4 flex items-center gap-2">
               <MousePointer2 className="w-4 h-4 text-pink-500" /> Top Content
            </h3>
            <div className="space-y-4">
               {[
                 { page: '/studies/beat-the-bloat', views: '4.2k' },
                 { page: '/trials', views: '2.8k' },
                 { page: '/capabilities', views: '1.4k' },
                 { page: '/about', views: '980' }
               ].map((p, i) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-all">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white">{p.page}</span>
                    <span className="text-[9px] font-black text-white italic">{p.views}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em] border-b border-white/5 pb-4 flex items-center gap-2">
               <Search className="w-4 h-4 text-blue-500" /> Traffic Sources
            </h3>
            <div className="space-y-4">
               {[
                 { source: 'Direct Access', val: 45, color: 'text-blue-500' },
                 { source: 'Google Search', val: 30, color: 'text-indigo-500' },
                 { source: 'Referral/Sponsors', val: 15, color: 'text-emerald-500' },
                 { source: 'Social Media', val: 10, color: 'text-pink-500' }
               ].map((s, i) => (
                 <div key={i} className="flex items-center gap-4">
                    <div className={`text-[10px] font-black italic uppercase w-32 ${s.color}`}>{s.source}</div>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full bg-current`} style={{ width: `${s.val}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-white">{s.val}%</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-[#1e1b4b]/30 border border-indigo-500/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
            <TrendingUp className="w-12 h-12 text-indigo-400 animate-bounce" />
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter relative z-10">Real-Time Mode</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] relative z-10">Websocket connection established. Receiving live event stream.</p>
            <div className="px-6 py-2 bg-indigo-500 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-xl shadow-indigo-500/40 cursor-pointer hover:scale-105 transition-all z-10">
               Enter Watchroom
            </div>
         </div>
      </div>
    </div>
  );
}
