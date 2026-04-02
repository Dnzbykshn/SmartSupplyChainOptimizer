import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Read payload from the request, fallback to defaults if none provided
        let payload = {
            crisis_description: "Red Sea & Suez Canal Maritime Disruption",
            affected_routes: "Shenzhen → Rotterdam (via Red Sea), Mumbai → Genoa (via Suez Canal)"
        };
        
        try {
            const body = await req.json();
            if (body && body.crisis_description) {
                payload = body;
            }
        } catch (e) {
            // Ignore JSON parse errors if body is empty
        }

        console.log("[Next.js] Forwarding payload to FastAPI:", payload);

        // Forward the request to the FastAPI server running on port 8000
        const response = await fetch('http://127.0.0.1:8000/api/analyze-crisis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json({ 
                success: false, 
                error: `FastAPI Error: ${response.statusText}`, 
                details: errorData 
            }, { status: response.status });
        }

        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            message: 'CrewAI analysis completed successfully.',
            data: data
        });

    } catch (error) {
        console.error("[Next.js] API Route Error:", error);
        return NextResponse.json({
            success: false,
            error: `Failed to communicate with FastAPI: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 500 });
    }
}
