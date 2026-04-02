/**
 * API Route: POST /api/crew/run
 * 
 * Triggers the CrewAI Python backend to generate new mitigation plans.
 * Spawns the Python process in the background and returns immediately.
 * The frontend polls /api/crew/plans to detect when new data arrives.
 */

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

let isRunning = false;

export async function POST() {
    if (isRunning) {
        return NextResponse.json({
            success: false,
            error: 'A crew is already running. Please wait for it to complete.',
        }, { status: 409 });
    }

    isRunning = true;

    try {
        const backendDir = path.join(process.cwd(), 'backend');
        const pythonPath = path.join(backendDir, '.venv', 'Scripts', 'python');
        const scriptPath = path.join(backendDir, 'src', 'supply_chain_crew', 'main.py');

        // Spawn the Python process in background
        const child = spawn(pythonPath, [scriptPath], {
            cwd: backendDir,
            env: {
                ...process.env,
                PYTHONPATH: 'src',
                PYTHONIOENCODING: 'utf-8',
            },
            stdio: 'pipe',
        });

        // Log output for debugging
        child.stdout?.on('data', (data) => {
            console.log(`[CrewAI] ${data.toString().trim()}`);
        });

        child.stderr?.on('data', (data) => {
            console.error(`[CrewAI Error] ${data.toString().trim()}`);
        });

        // When the process finishes, mark as not running
        child.on('close', (code) => {
            isRunning = false;
            console.log(`[CrewAI] Process exited with code ${code}`);
        });

        child.on('error', (err) => {
            isRunning = false;
            console.error(`[CrewAI] Process error: ${err.message}`);
        });

        return NextResponse.json({
            success: true,
            message: 'CrewAI analysis started. Agents are working...',
        });

    } catch (error) {
        isRunning = false;
        return NextResponse.json({
            success: false,
            error: `Failed to start CrewAI: ${error}`,
        }, { status: 500 });
    }
}

// GET: Check if a crew is currently running
export async function GET() {
    return NextResponse.json({ isRunning });
}
