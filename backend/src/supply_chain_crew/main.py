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


def save_to_supabase(supabase, plans_data: dict, crisis_inputs: dict, agent_outputs: dict | None = None):
    """Save the crisis run, agent outputs, and mitigation plans to Supabase."""
    try:
        # 1. Insert the crisis run with intermediate agent outputs
        run_payload = {
            "crisis_description": crisis_inputs["crisis_description"],
            "affected_routes": crisis_inputs["affected_routes"],
            "inventory_status": crisis_inputs["current_inventory_status"],
            "status": "completed",
        }

        # Include agent intermediate outputs if available
        if agent_outputs:
            if agent_outputs.get("risk_scout"):
                run_payload["risk_scout_output"] = agent_outputs["risk_scout"]
            if agent_outputs.get("forecaster"):
                run_payload["forecaster_output"] = agent_outputs["forecaster"]

        run_result = supabase.table("crisis_runs").insert(run_payload).execute()

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


# ── User Settings Loader ──────────────────────────────────────────────

CARRIER_LABELS = {
    'any': 'No Preference (Best Available)',
    'maersk': 'Maersk Line',
    'msc': 'MSC',
    'cosco': 'COSCO Shipping',
    'evergreen': 'Evergreen Marine',
    'one': 'ONE (Ocean Network Express)',
}

def fetch_user_settings(supabase) -> dict | None:
    """Fetch corporate parameters from the user_settings table."""
    if not supabase:
        return None
    try:
        response = supabase.table("user_settings").select("*").limit(1).single().execute()
        if response.data:
            print(f"⚙️  User settings loaded from Supabase")
            return response.data
    except Exception as e:
        print(f"⚠️  Failed to load user settings: {e}")
    return None


def format_settings_for_prompt(settings: dict | None) -> str:
    """Convert user_settings DB row into a readable context string for agents."""
    if not settings:
        return (
            "No corporate configuration found. Use balanced defaults: "
            "risk tolerance 5/10, $250K air freight budget, 14 days safety stock, "
            "no carrier preference, balanced cost optimization."
        )

    risk = settings.get('risk_tolerance_level', 5)
    budget = settings.get('max_air_freight_budget', 250000)
    safety_days = settings.get('min_safety_stock_days', 14)
    auto_reroute = settings.get('auto_reroute_enabled', False)
    carrier = settings.get('preferred_carrier', 'any')
    cost_mode = settings.get('cost_optimization_mode', 'balanced')

    carrier_label = CARRIER_LABELS.get(carrier, carrier)

    # Build a natural language context
    risk_desc = "very conservative" if risk <= 3 else "balanced" if risk <= 6 else "aggressive"
    budget_str = f"${budget:,.0f}"

    lines = [
        f"CORPORATE CONFIGURATION (from database — these MUST influence your recommendations):",
        f"- Risk Tolerance: {risk}/10 ({risk_desc} — {'prioritize safety and reliability over cost savings' if risk <= 3 else 'balance cost and reliability equally' if risk <= 6 else 'accept higher risk for significant cost savings'})",
        f"- Maximum Air Freight Budget: {budget_str} per crisis event {'(very limited — avoid expensive air freight unless absolutely critical)' if budget < 100000 else '(moderate budget available)' if budget < 300000 else '(generous budget — air freight is a viable option)'}",
        f"- Minimum Safety Stock: {safety_days} days (flag any component with fewer days remaining as CRITICAL)",
        f"- Auto-Reroute: {'ENABLED — you may recommend automatic rerouting for plans under budget threshold' if auto_reroute else 'DISABLED — all rerouting requires human authorization'}",
        f"- Preferred Carrier: {carrier_label} {'— prioritize this carrier in routing options when available' if carrier != 'any' else ''}",
        f"- Cost Optimization Mode: {cost_mode.upper()} — {'minimize costs aggressively, accept moderate delays' if cost_mode == 'aggressive' else 'find optimal balance between cost and speed' if cost_mode == 'balanced' else 'prioritize speed and reliability, cost is secondary'}",
    ]

    return "\n".join(lines)


# ── Dynamic Crisis Scenario Inputs ────────────────────────────────────
# These values are injected into the YAML placeholders at runtime.

CRISIS_INPUTS = {
    "crisis_description": (
        "Search the internet for the most recent news regarding shipping delays and disruptions "
        "in the Red Sea and Suez Canal area. Find out what the current situation is, which shipping "
        "companies are routing around the Cape of Good Hope, and what the estimated delays are. "
        "Use this live information to form your risk assessment."
    ),
    "affected_routes": (
        "Shenzhen → Rotterdam (via Red Sea), Mumbai → Genoa (via Suez Canal)"
    ),
    "current_inventory_status": (
        "Do NOT rely on your general knowledge. YOUR SOLE OBJECTIVE for this section is to "
        "query the Supabase Database using your Query Supabase Inventory tool to find the exact, "
        "live stock levels for all our items. Calculate the remaining days of supply based on "
        "the database data."
    ),
    "user_settings": "(will be loaded from database at runtime)",
}


def main():
    """Execute the Supply Chain Crisis Resolution Crew."""
    print("=" * 70)
    print("  SMART SUPPLY CHAIN OPTIMIZER — Multi-Agent Crisis Resolution")
    print("=" * 70)
    print(f"\n📡 Crisis: Red Sea & Suez Canal Disruption (Live Web Search)")
    print(f"🤖 Agents: Global Risk Scout → Inventory Forecaster → Routing Strategist")
    print(f"🧠 LLM: Google Gemini")
    print(f"\n{'─' * 70}\n")

    # ── Initialize Supabase ───────────────────────────────────────────
    supabase = get_supabase_client()

    # ── Load user settings and inject into inputs ─────────────────────
    user_settings = fetch_user_settings(supabase)
    CRISIS_INPUTS["user_settings"] = format_settings_for_prompt(user_settings)
    print(f"\n📋 Agent Configuration Context:\n{CRISIS_INPUTS['user_settings']}\n")

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

    # ── Extract intermediate agent outputs ─────────────────────────────
    agent_outputs = {}
    if hasattr(result, 'tasks_output') and result.tasks_output:
        tasks = result.tasks_output
        if len(tasks) > 0:
            # Try structured JSON first, fall back to raw text
            if tasks[0].pydantic:
                agent_outputs["risk_scout"] = json.dumps(tasks[0].pydantic.model_dump(), ensure_ascii=False)
                print(f"\n🔍 Risk Scout structured output captured")
            else:
                agent_outputs["risk_scout"] = tasks[0].raw
                print(f"\n🔍 Risk Scout raw output captured ({len(tasks[0].raw)} chars)")
        if len(tasks) > 1:
            if tasks[1].pydantic:
                agent_outputs["forecaster"] = json.dumps(tasks[1].pydantic.model_dump(), ensure_ascii=False)
                print(f"📊 Forecaster structured output captured")
            else:
                agent_outputs["forecaster"] = tasks[1].raw
                print(f"📊 Forecaster raw output captured ({len(tasks[1].raw)} chars)")
    
    # ── Save to Supabase ──────────────────────────────────────────────
    if plans_data and supabase:
        save_to_supabase(supabase, plans_data, CRISIS_INPUTS, agent_outputs)

    print(f"\n{'─' * 70}")
    print("✅ Crew execution complete.")
    print(f"📊 Token usage: {result.token_usage}")


if __name__ == "__main__":
    main()
