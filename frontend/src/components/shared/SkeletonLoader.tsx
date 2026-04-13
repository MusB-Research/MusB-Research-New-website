import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => (
    <div className={`bg-white/5 animate-pulse rounded-lg ${className}`} />
);

export const SkeletonRow = ({ columns = 4 }: { columns?: number }) => (
    <div className="flex items-center gap-6 py-8 px-6 border-b border-white/5">
        {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        ))}
    </div>
);

export const SkeletonCard = () => (
    <div className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
        <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-20" />
    </div>
);

export const SkeletonLoader = ({ type = 'table', rows = 5 }: { type?: 'table' | 'grid' | 'details', rows?: number }) => {
    if (type === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (type === 'details') {
        return (
            <div className="space-y-10">
                <div className="flex gap-6 items-center">
                    <Skeleton className="w-16 h-16 rounded-[2rem]" />
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white/5 p-8 rounded-[2rem] space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="bg-white/5 px-10 py-6">
                <Skeleton className="h-5 w-48" />
            </div>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} columns={4} />)}
        </div>
    );
};
