/**
 * types.ts — Central TypeScript type definitions
 * 
 * ARCHITECTURAL NOTE:
 * These interfaces define the data contracts that will eventually be served
 * by Supabase (PostgreSQL) and processed by the Multi-Agent AI system.
 * For Part 1, all data conforming to these types is hardcoded in mock-data.ts.
 */

// ─── Dashboard Types ────────────────────────────────────────────────────────

/** A single KPI metric displayed on the dashboard */
export interface Metric {
  id: string;
  label: string;
  value: string;
  change: string;          // e.g. "+2.3%" or "-5 units"
  trend: 'up' | 'down' | 'neutral';
  icon: string;            // Lucide icon name
}

/** A shipment row in the global shipments table */
export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  status: 'In Transit' | 'Delayed' | 'Delivered' | 'At Risk' | 'Customs Hold';
  eta: string;
  cargo: string;
  value: string;
}

/** A critical supply chain alert */
export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedRoutes: string[];
  estimatedImpact: string;
  timestamp: string;
}

// ─── Crisis Resolution Types ────────────────────────────────────────────────

/** Output from the Global Risk Scout AI Agent */
export interface RiskScoutData {
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  eventName: string;
  eventDescription: string;
  affectedPorts: string[];
  weatherConditions: string;
  newsHeadlines: string[];
  geopoliticalFactors: string[];
  estimatedDuration: string;
}

/** Output from the Inventory Forecaster AI Agent */
export interface InventoryImpact {
  criticalItems: {
    name: string;
    currentStock: number;
    dailyBurnRate: number;
    daysUntilDepletion: number;
    reorderPoint: number;
    status: 'Critical' | 'Warning' | 'Stable';
  }[];
  totalSkusAffected: number;
  revenueAtRisk: string;
  productionLineImpact: string;
}

/** A single mitigation plan from the Routing Strategist AI Agent */
export interface MitigationPlan {
  id: string;
  name: string;
  strategy: string;
  description: string;
  estimatedCost: string;
  timeframe: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  co2Impact: string;
  reliabilityScore: number;  // 0-100
  details: string[];
}

// ─── Settings / Agent Configuration Types ────────────────────────────────────

/**
 * ARCHITECTURAL NOTE:
 * AgentConfig values will eventually be persisted to Supabase and consumed
 * by the Multi-Agent orchestrator to influence agent decision-making.
 * For Part 1, these are stored in React client state only.
 */
export interface AgentConfig {
  riskToleranceLevel: number;          // 1-10 scale
  maxAirFreightBudget: number;         // in USD
  minSafetyStockDays: number;          // 0-90
  autoRerouteEnabled: boolean;
  preferredCarrier: string;
  notificationFrequency: 'realtime' | 'hourly' | 'daily';
  costOptimizationMode: 'aggressive' | 'balanced' | 'conservative';
}
