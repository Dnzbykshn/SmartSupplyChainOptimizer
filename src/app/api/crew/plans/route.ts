/**
 * API Route: /api/crew/plans
 * 
 * Serves the CrewAI-generated mitigation plans to the frontend.
 * Priority: Supabase → Local JSON file → Error
 * 
 * Reads the most recent completed crisis run from Supabase,
 * then fetches its associated mitigation plans.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
    // ── Try Supabase first ───────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Get the latest completed crisis run
            const { data: latestRun } = await supabase
                .from('crisis_runs')
                .select('id, crisis_description, created_at')
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (latestRun) {
                // Get the mitigation plans for this run
                const { data: plans } = await supabase
                    .from('mitigation_plans')
                    .select('*')
                    .eq('run_id', latestRun.id)
                    .order('plan_id', { ascending: true });

                if (plans && plans.length > 0) {
                    // Map snake_case DB columns to camelCase frontend fields
                    const formattedPlans = plans.map((p) => ({
                        id: p.plan_id,
                        name: p.name,
                        strategy: p.strategy,
                        description: p.description,
                        estimatedCost: p.estimated_cost,
                        timeframe: p.timeframe,
                        riskLevel: p.risk_level,
                        co2Impact: p.co2_impact,
                        reliabilityScore: p.reliability_score,
                        details: p.details,
                    }));

                    return NextResponse.json({
                        success: true,
                        source: 'supabase',
                        runId: latestRun.id,
                        crisisDescription: latestRun.crisis_description,
                        createdAt: latestRun.created_at,
                        plans: formattedPlans,
                    });
                }
            }
        } catch (error) {
            console.log('Supabase fetch failed, falling back to file:', error);
        }
    }

    // ── Fallback: Read from local JSON file ──────────────────────────
    try {
        const filePath = path.join(process.cwd(), 'backend', 'output_plan.json');
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        return NextResponse.json({
            success: true,
            source: 'file',
            plans: data.plans,
        });
    } catch {
        return NextResponse.json({
            success: false,
            source: 'fallback',
            plans: null,
            error: 'No data available. Run the CrewAI backend first.',
        });
    }
}
