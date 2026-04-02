/**
 * API Route: /api/crew/history
 * 
 * Returns all past crisis runs with their mitigation plans.
 * Ordered by most recent first.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ success: false, error: 'Supabase not configured' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch all completed crisis runs
        const { data: runs, error } = await supabase
            .from('crisis_runs')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!runs || runs.length === 0) {
            return NextResponse.json({ success: true, runs: [] });
        }

        // For each run, fetch associated mitigation plans
        const runsWithPlans = await Promise.all(
            runs.map(async (run) => {
                const { data: plans } = await supabase
                    .from('mitigation_plans')
                    .select('*')
                    .eq('run_id', run.id)
                    .order('plan_id', { ascending: true });

                return {
                    id: run.id,
                    crisisDescription: run.crisis_description,
                    affectedRoutes: run.affected_routes,
                    status: run.status,
                    createdAt: run.created_at,
                    riskScoutOutput: run.risk_scout_output || null,
                    forecasterOutput: run.forecaster_output || null,
                    plans: (plans || []).map((p) => ({
                        id: p.plan_id,
                        name: p.name,
                        strategy: p.strategy,
                        description: p.description,
                        estimatedCost: p.estimated_cost,
                        timeframe: p.timeframe,
                        riskLevel: p.risk_level,
                        co2Impact: p.co2_impact,
                        reliabilityScore: p.reliability_score,
                    })),
                };
            })
        );

        return NextResponse.json({ success: true, runs: runsWithPlans });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json({
            success: false,
            error: `Failed to fetch history: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
}
