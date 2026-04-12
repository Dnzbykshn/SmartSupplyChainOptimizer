/**
 * DisclaimerBanner.tsx — Persistent top banner
 * 
 * Displays a visually subtle but persistent disclaimer across all pages,
 * indicating this is a university assignment with live AI integration.
 */

import { Sparkles } from 'lucide-react';

export default function DisclaimerBanner() {
    return (
        <div className="w-full bg-emerald-900/30 border-b border-emerald-700/40 px-4 py-2">
            <div className="flex items-center gap-2 justify-center text-xs text-emerald-200/80">
                <Sparkles size={14} className="shrink-0" />
                <span>
                    <strong>University Assignment:</strong> Full-stack AI platform powered by
                    CrewAI &amp; LangGraph Multi-Agent orchestration, Supabase PostgreSQL, LangSmith, and Google Gemini.
                </span>
            </div>
        </div>
    );
}
