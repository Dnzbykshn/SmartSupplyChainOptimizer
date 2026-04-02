"""
main.py — Entry Point for the Supply Chain Crisis Resolution System

Executes the Multi-Agent AI crew with a realistic Shanghai Port Strike
scenario. Dynamic inputs are injected into the YAML-defined agents and
tasks via placeholders.

Usage:
    cd backend
    python -m supply_chain_crew.main

Output:
    Writes final MitigationPlan[] to both:
      1. output_plan.json (local file fallback)
      2. Supabase database (for frontend realtime consumption)
"""

import json
import os
import sys

from dotenv import load_dotenv

# ── Load environment variables ────────────────────────────────────────
load_dotenv()

# Validate API key is present
if not os.getenv("GEMINI_API_KEY"):
    print("ERROR: GEMINI_API_KEY not found in environment.")
    print("Please add your Gemini API key to backend/.env")
    sys.exit(1)

# Set the model for CrewAI (uses LiteLLM format for Gemini)
os.environ["OPENAI_API_KEY"] = "NA"  # Prevent CrewAI from complaining
os.environ["CREWAI_LLM_PROVIDER"] = "gemini"

from supply_chain_crew.crew import SupplyChainCrew

# ── Supabase Client Setup ─────────────────────────────────────────────

def get_supabase_client():
    """Initialize Supabase client. Returns None if not configured."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key or "BURAYA" in supabase_url:
        print("⚠️  Supabase not configured — writing to local file only.")
        return None

    try:
        from supabase import create_client
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"⚠️  Supabase connection failed: {e}")
        return None


def save_to_supabase(supabase, plans_data: dict, crisis_inputs: dict):
    """Save the crisis run and mitigation plans to Supabase."""
    try:
        # 1. Insert the crisis run
        run_result = supabase.table("crisis_runs").insert({
            "crisis_description": crisis_inputs["crisis_description"],
            "affected_routes": crisis_inputs["affected_routes"],
            "inventory_status": crisis_inputs["current_inventory_status"],
            "status": "completed",
        }).execute()

        run_id = run_result.data[0]["id"]
        print(f"📦 Crisis run saved to Supabase (ID: {run_id})")

        # 2. Insert each mitigation plan linked to this run
        for plan in plans_data["plans"]:
            supabase.table("mitigation_plans").insert({
                "run_id": run_id,
                "plan_id": plan["id"],
                "name": plan["name"],
                "strategy": plan["strategy"],
                "description": plan["description"],
                "estimated_cost": plan["estimatedCost"],
                "timeframe": plan["timeframe"],
                "risk_level": plan["riskLevel"],
                "co2_impact": plan["co2Impact"],
                "reliability_score": plan["reliabilityScore"],
                "details": plan["details"],
            }).execute()

        print(f"✅ {len(plans_data['plans'])} mitigation plans saved to Supabase!")
        return run_id

    except Exception as e:
        print(f"❌ Supabase write failed: {e}")
        return None


# ── Dynamic Crisis Scenario Inputs ────────────────────────────────────
# These values are injected into the YAML placeholders at runtime.

CRISIS_INPUTS = {
    "crisis_description": (
        "Major labor strike at Shanghai Yangshan Deep-Water Port has halted "
        "all container operations since March 2, 2026. Over 12,000 dockworkers "
        "have walked off the job, demanding improved safety protocols and wage "
        "increases. An estimated 340+ vessels are currently anchored or diverted. "
        "This disruption affects approximately 26% of global container throughput. "
        "Negotiations between the Shanghai Port Authority and the Dockworkers "
        "Union have stalled, with no resolution expected for at least 7-14 days."
    ),
    "affected_routes": (
        "Shanghai → Rotterdam, Shanghai → Los Angeles, "
        "Shanghai → Hamburg, Ningbo → Long Beach"
    ),
    "current_inventory_status": (
        "Li-Ion Battery Cells (Type 21700): 45,000 units, 8,500/day burn rate. "
        "OLED Display Modules (6.7 inch): 12,000 units, 3,200/day burn rate. "
        "PCB Assembly Boards (Rev. C): 28,000 units, 2,100/day burn rate. "
        "Aluminum Enclosure Shells: 67,000 units, 1,800/day burn rate."
    ),
}


def main():
    """Execute the Supply Chain Crisis Resolution Crew."""
    print("=" * 70)
    print("  SMART SUPPLY CHAIN OPTIMIZER — Multi-Agent Crisis Resolution")
    print("=" * 70)
    print(f"\n📡 Crisis: Shanghai Yangshan Port Labor Strike")
    print(f"🤖 Agents: Global Risk Scout → Inventory Forecaster → Routing Strategist")
    print(f"🧠 LLM: Google Gemini")
    print(f"\n{'─' * 70}\n")

    # ── Initialize Supabase ───────────────────────────────────────────
    supabase = get_supabase_client()

    # ── Instantiate and run the crew ──────────────────────────────────
    crew_instance = SupplyChainCrew().crew()
    result = crew_instance.kickoff(inputs=CRISIS_INPUTS)

    # ── Extract and save the final structured output ──────────────────
    print(f"\n{'=' * 70}")
    print("  FINAL OUTPUT — Mitigation Plans")
    print(f"{'=' * 70}\n")

    plans_data = None

    if result.pydantic:
        plans_data = result.pydantic.model_dump()
        output_json = json.dumps(plans_data, indent=2, ensure_ascii=False)
        # Save to local file (fallback)
        with open("output_plan.json", "w", encoding="utf-8") as f:
            f.write(output_json)
        print("💾 Local file: output_plan.json saved.")
    elif result.json_dict:
        plans_data = result.json_dict
        with open("output_plan.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(plans_data, indent=2, ensure_ascii=False))
        print("💾 Local file: output_plan.json saved (fallback).")
    else:
        print("⚠️  Structured output parsing failed. Raw output:")
        print(result.raw)

    # ── Save to Supabase ──────────────────────────────────────────────
    if plans_data and supabase:
        save_to_supabase(supabase, plans_data, CRISIS_INPUTS)

    print(f"\n{'─' * 70}")
    print("✅ Crew execution complete.")
    print(f"📊 Token usage: {result.token_usage}")


if __name__ == "__main__":
    main()
