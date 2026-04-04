import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
    unreadCount: number;
    onClick?: () => void;
    className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick, className = "" }) => {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all relative group shadow-lg active:scale-90 shrink-0 ${
                unreadCount > 0 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:border-amber-500/50' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
            } ${className}`}
        >
            <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'animate-bounce' : 'group-hover:rotate-12'}`} />
            
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-[#0B101B] text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-in zoom-in duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
