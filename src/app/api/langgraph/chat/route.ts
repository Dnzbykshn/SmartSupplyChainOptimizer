/**
 * API Route: /api/langgraph/chat
 * 
 * Proxies chat messages to the LangGraph AI assistant
 * running on the FastAPI backend at port 8000.
 */

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.message) {
            return NextResponse.json({
                success: false,
                error: 'Message field is required',
            }, { status: 400 });
        }

        console.log("[Next.js] Forwarding chat to LangGraph:", body.message.substring(0, 80));

        const response = await fetch('http://127.0.0.1:8000/api/langgraph/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: body.message,
                history: body.history || null,
            }),
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
        console.error("[Next.js] LangGraph Chat Error:", error);
        return NextResponse.json({
            success: false,
            error: `Failed to communicate with FastAPI: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 500 });
    }
}
