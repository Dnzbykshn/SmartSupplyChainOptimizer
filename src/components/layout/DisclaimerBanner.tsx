/**
 * DisclaimerBanner.tsx — Persistent top banner
 * 
 * Displays a visually subtle but persistent disclaimer across all pages,
 * indicating this is a static UI draft for a university assignment.
 */

import { Info } from 'lucide-react';

export default function DisclaimerBanner() {
    return (
        <div className="w-full bg-amber-900/30 border-b border-amber-700/40 px-4 py-2">
            <div className="flex items-center gap-2 justify-center text-xs text-amber-200/80">
                <Info size={14} className="shrink-0" />
                <span>
                    <strong>University Assignment — Part 1:</strong> This is a static UI draft.
                    Multi-Agent AI orchestration &amp; Supabase integration will be implemented in future phases.
                </span>
            </div>
        </div>
    );
}
