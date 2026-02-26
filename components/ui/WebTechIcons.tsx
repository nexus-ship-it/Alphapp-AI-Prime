

import React from 'react';
import { ReactIcon, VueIcon, AngularIcon, SvelteIcon, NodeJsIcon, PythonIcon } from './TechIcons';
// FIX: Removed redundant import as GenericWebAppIcon is defined and exported in this file.
// import { GenericWebAppIcon } from './WebTechIcons'; 

export const NginxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#009639" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.24 0C5.484 0 0 5.484 0 12.24s5.484 12.24 12.24 12.24 12.24-5.484 12.24-12.24S18.996 0 12.24 0zm4.038 18.048h-2.31V9.582h-3.48v-2.19h5.79v10.656zm-7.65.108c-.84 0-1.578-.102-2.208-.306l.462-2.07c.528.162 1.032.24 1.512.24.81 0 1.218-.282 1.218-.852v-5.22h2.31v5.418c0 1.998-1.182 3.114-3.3 3.114z"/>
    </svg>
);

export const ApacheIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill="#CB3323" d="M12 2L1 12h5v10h12V12h5z"/>
        <path fill="#A32418" d="M12 2v20h6V12h5z"/>
        <path fill="#F0E6D8" d="M14.5 9.5l-2.5-4-2.5 4H7l5 7 5-7z"/>
        <path fill="#DCC8B0" d="M12 5.5v11l5-7z"/>
    </svg>
);

export const WordPressIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#21759B" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.3 12.5l-2.7 2.7c-1.2.9-2.8.9-4 0l-2.7-2.7c-1.2-1.2-1.2-3.1 0-4.2l2.7-2.7c1.2-1.2 3.1-1.2 4.2 0l2.7 2.7c1.1 1.1 1.1 2.9.1 4.2zM12 7.5L9 12h6l-3-4.5z"/>
    </svg>
);

export const CloudflareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#F38020" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.35 10.04A7.5 7.5 0 0012 4C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 14h-5v-4h2v2h3v2z"/>
    </svg>
);

export const GoogleAnalyticsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#F9AB00" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="4" height="10" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
);

export const PHPIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg" fill="#777BB4">
        <ellipse cx="40" cy="25" rx="38" ry="20"/>
        <text x="40" y="32" fontFamily="sans-serif" fontSize="24" fill="white" textAnchor="middle" fontWeight="bold">PHP</text>
    </svg>
);

export const GenericWebAppIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
    </svg>
);

// Tech icon map for TechDisplay component
const techIconMap: Record<string, React.FC<{ className?: string }>> = {
    'react': ReactIcon,
    'vue.js': VueIcon,
    'vue': VueIcon,
    'angular': AngularIcon,
    'svelte': SvelteIcon,
    'node.js': NodeJsIcon,
    'python': PythonIcon,
    'nginx': NginxIcon,
    'apache': ApacheIcon,
    'wordpress': WordPressIcon,
    'cloudflare': CloudflareIcon,
    'google analytics': GoogleAnalyticsIcon,
    'php': PHPIcon,
};

// Export TechDisplay directly from this file
export const TechDisplay: React.FC<{ techName: string }> = ({ techName }) => {
    const normalizedName = techName.toLowerCase();
    const Icon = Object.keys(techIconMap).find(key => normalizedName.includes(key)) 
        ? techIconMap[Object.keys(techIconMap).find(key => normalizedName.includes(key))!] 
        : GenericWebAppIcon;
    
    return (
        <div className="flex items-center gap-2 bg-border/20 px-3 py-1.5 rounded-md text-sm">
            <Icon className="w-5 h-5" />
            <span className="font-medium text-text-primary">{techName}</span>
        </div>
    );
};