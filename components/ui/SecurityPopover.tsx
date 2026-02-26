import React from 'react';
import { LinkAnalysisResult } from '../../types';
import { ShieldCheckIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface SecurityPopoverProps {
    result: LinkAnalysisResult;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement>;
}

export const SecurityPopover: React.FC<SecurityPopoverProps> = ({ result, onClose, anchorRef }) => {
    const score = (result.security.usesHttps ? 50 : 0) + result.security.securityHeaders.filter(h => h.present).length * 15;
    const isSecure = score > 60;

    const popoverStyle: React.CSSProperties = {};
    if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        popoverStyle.top = `${rect.bottom + 8}px`;
        popoverStyle.right = `${window.innerWidth - rect.right}px`;
    }

    return (
         <div 
            className="fixed inset-0 z-40"
            onClick={onClose}
        />
    );
};
