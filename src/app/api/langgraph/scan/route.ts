/**
 * API Route: /api/langgraph/scan
 * 
 * Proxies the LangGraph risk monitoring scan request
 * to the FastAPI backend at port 8000.
 */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        let payload = {};
        try {
            payload = await req.json();
        } catch {
            // Empty body is fine — uses default routes
        }

        console.log("[Next.js] Triggering LangGraph risk scan");

        const response = await fetch('http://127.0.0.1:8000/api/langgraph/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json({
                success: false,
                error: `FastAPI Error: ${response.statusText}`,
                details: errorData,
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, ...data });

    } catch (error) {
        console.error("[Next.js] LangGraph Scan Error:", error);
        return NextResponse.json({
            success: false,
            error: `Failed to communicate with FastAPI: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 500 });
    }
}
