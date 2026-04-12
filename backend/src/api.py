import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure env vars are loaded before anything else
load_dotenv()

# We need to set up CrewAI vars before importing
os.environ["OPENAI_API_KEY"] = "NA"
os.environ["CREWAI_LLM_PROVIDER"] = "gemini"

from supply_chain_crew.crew import SupplyChainCrew
from supply_chain_crew.main import get_supabase_client, save_to_supabase, fetch_user_settings, format_settings_for_prompt

# LangGraph imports (new — does NOT modify CrewAI above)
from supply_chain_graph import run_risk_scan, run_chat

# Create FastAPI App
app = FastAPI(
    title="Smart Supply Chain Optimizer API",
    description="API to trigger the CrewAI Supply Chain Orchestration System",
    version="1.0.0"
)

# Allow CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Payload Models
class CrisisPayload(BaseModel):
    crisis_description: str
    affected_routes: str
    
class ChatPayload(BaseModel):
    message: str
    history: list[dict] | None = None

class ScanPayload(BaseModel):
    routes: list[str] | None = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engines": ["crewai", "langgraph"],
        "message": "Supply Chain API is running. CrewAI + LangGraph active.",
    }

@app.post("/api/analyze-crisis")
async def analyze_crisis(payload: CrisisPayload):
    """
    Triggers the CrewAI agent orchestration synchronously.
    Returns the parsed mitigation plans. 
    """
    try:
        supabase = get_supabase_client()
        
        # Load user settings from database
        user_settings = fetch_user_settings(supabase)
        settings_context = format_settings_for_prompt(user_settings)
        
        # Build the dynamic inputs for the Crew
        crisis_inputs = {
            "crisis_description": payload.crisis_description,
            "affected_routes": payload.affected_routes,
            "current_inventory_status": (
                "Do NOT rely on your general knowledge. YOUR SOLE OBJECTIVE for this section is to "
                "query the Supabase Database using your Query Supabase Inventory tool to find the exact, "
                "live stock levels for all our items. Calculate the remaining days of supply based on "
                "the database data."
            ),
            "user_settings": settings_context,
        }
        
        print("🚀 API Received Analysis Request. Starting CrewAI...")
        # Instantiate and run
        crew_instance = SupplyChainCrew().crew()
        result = crew_instance.kickoff(inputs=crisis_inputs)
        
        # Parse Structured Output (final plans)
        plans_data = None
        if result.pydantic:
            plans_data = result.pydantic.model_dump()
        elif result.json_dict:
            plans_data = result.json_dict
            
        if not plans_data:
            raise HTTPException(status_code=500, detail="CrewAI failed to generate a structured JSON output.")

        # Extract intermediate agent outputs (Risk Scout + Forecaster)
        agent_outputs = {}
        if hasattr(result, 'tasks_output') and result.tasks_output:
            tasks = result.tasks_output
            if len(tasks) > 0:
                if tasks[0].pydantic:
                    agent_outputs["risk_scout"] = json.dumps(tasks[0].pydantic.model_dump(), ensure_ascii=False)
                else:
                    agent_outputs["risk_scout"] = tasks[0].raw
            if len(tasks) > 1:
                if tasks[1].pydantic:
                    agent_outputs["forecaster"] = json.dumps(tasks[1].pydantic.model_dump(), ensure_ascii=False)
                else:
                    agent_outputs["forecaster"] = tasks[1].raw
            
        # Save to database (including intermediate outputs)
        run_id = None
        if supabase:
            run_id = save_to_supabase(supabase, plans_data, crisis_inputs, agent_outputs)
            
        return {
            "status": "success",
            "run_id": run_id,
            "plans": plans_data.get("plans", []),
            "agent_outputs": agent_outputs,
        }

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
# ═══════════════════════════════════════════════════════════════════════
#  LANGGRAPH ENDPOINTS (NEW — CrewAI endpoints above are UNCHANGED)
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/langgraph/scan")
async def langgraph_risk_scan(payload: ScanPayload = ScanPayload()):
    """
    Triggers a LangGraph risk monitoring scan across shipping routes.
    Searches the web for recent disruption news and scores each route.
    """
    try:
        print("🛡️ API: Starting LangGraph Risk Scan...")
        result = run_risk_scan(routes=payload.routes)
        return {
            "status": "success",
            "engine": "langgraph",
            **result,
        }
    except Exception as e:
        print(f"❌ LangGraph Scan Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/langgraph/chat")
async def langgraph_chat(payload: ChatPayload):
    """
    Sends a message to the LangGraph AI Chat Assistant.
    The agent can query inventory, crisis history, and risk data.
    """
    try:
        print(f"💬 API: Chat message received: {payload.message[:80]}...")
        result = run_chat(
            user_message=payload.message,
            chat_history=payload.history,
        )
        return {
            "status": "success",
            "engine": "langgraph",
            **result,
        }
    except Exception as e:
        print(f"❌ LangGraph Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/langgraph/scans")
async def get_risk_scans():
    """
    Returns the latest risk scan results from Supabase.
    """
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")

        response = (
            supabase.table("risk_scans")
            .select("*")
            .order("scanned_at", desc=True)
            .limit(20)
            .execute()
        )
        return {
            "status": "success",
            "scans": response.data or [],
        }
    except Exception as e:
        print(f"❌ Scans Fetch Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # To run: .venv\Scripts\python src/api.py
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
