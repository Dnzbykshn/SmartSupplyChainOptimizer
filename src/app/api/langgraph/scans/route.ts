/**
 * API Route: /api/langgraph/scans
 * 
 * Proxies GET request to fetch recent risk scan results
 * from the FastAPI backend at port 8000.
 */

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/langgraph/scans', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
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
        console.error("[Next.js] Scans Fetch Error:", error);
        return NextResponse.json({
            success: false,
            error: `Failed to communicate with FastAPI: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 500 });
    }
}
