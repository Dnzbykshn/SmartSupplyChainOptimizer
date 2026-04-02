"""
crew.py — CrewAI Orchestration Class

Uses the @CrewBase decorator pattern to wire YAML configurations
to Python agent/task definitions. The crew runs a sequential pipeline:

    Global Risk Scout → Inventory Forecaster → Routing Strategist

The final task enforces structured Pydantic output via `output_pydantic`,
ensuring the JSON matches the frontend TypeScript interfaces exactly.
"""

from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool

from supply_chain_crew.models import MitigationPlanList, RiskScoutOutput, InventoryImpactOutput
from supply_chain_crew.tools import SupabaseInventoryTool

# Instantiate the Gemini LLM
gemini_llm = LLM(model="gemini/gemini-3-flash-preview")

# Instantiate Search Tool
search_tool = SerperDevTool()

# Instantiate Database Tool
inventory_tool = SupabaseInventoryTool()


@CrewBase
class SupplyChainCrew:
    """Smart Supply Chain Optimizer — Multi-Agent Crisis Resolution Crew"""

    # YAML configuration file paths (relative to this file's directory)
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # ─── Agent Definitions ────────────────────────────────────────────

    @agent
    def global_risk_scout(self) -> Agent:
        return Agent(
            config=self.agents_config["global_risk_scout"],  # type: ignore[index]
            verbose=True,
            allow_delegation=False,
            llm=gemini_llm,
            tools=[search_tool],
        )

    @agent
    def inventory_forecaster(self) -> Agent:
        return Agent(
            config=self.agents_config["inventory_forecaster"],  # type: ignore[index]
            verbose=True,
            allow_delegation=False,
            llm=gemini_llm,
            tools=[inventory_tool],
        )

    @agent
    def routing_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config["routing_strategist"],  # type: ignore[index]
            verbose=True,
            allow_delegation=False,
            llm=gemini_llm,
        )

    # ─── Task Definitions ─────────────────────────────────────────────

    @task
    def risk_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config["risk_analysis_task"],  # type: ignore[index]
            output_pydantic=RiskScoutOutput,
        )

    @task
    def inventory_impact_task(self) -> Task:
        return Task(
            config=self.tasks_config["inventory_impact_task"],  # type: ignore[index]
            context=[self.risk_analysis_task()],
            output_pydantic=InventoryImpactOutput,
        )

    @task
    def routing_strategy_task(self) -> Task:
        return Task(
            config=self.tasks_config["routing_strategy_task"],  # type: ignore[index]
            context=[self.risk_analysis_task(), self.inventory_impact_task()],
            output_pydantic=MitigationPlanList,
        )

    # ─── Crew Assembly ────────────────────────────────────────────────

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,   # Auto-collected by @agent decorator
            tasks=self.tasks,     # Auto-collected by @task decorator
            process=Process.sequential,
            verbose=True,
        )
