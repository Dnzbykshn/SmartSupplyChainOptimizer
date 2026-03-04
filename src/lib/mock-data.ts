/**
 * mock-data.ts — Hardcoded data simulating future AI agent outputs
 * 
 * ARCHITECTURAL NOTE:
 * In Phase 2, this file will be replaced by:
 *   1. Supabase queries (for shipments, alerts, configurations)
 *   2. Real-time agent outputs (for risk scout, inventory forecaster, routing strategist)
 * The data structures here mirror exactly what the AI agents will produce.
 */

import type {
    Metric,
    Shipment,
    Alert,
    RiskScoutData,
    InventoryImpact,
    MitigationPlan,
    AgentConfig,
} from './types';

// ─── Dashboard KPI Metrics ──────────────────────────────────────────────────

export const dashboardMetrics: Metric[] = [
    {
        id: 'active-shipments',
        label: 'Active Shipments',
        value: '1,247',
        change: '+12 today',
        trend: 'up',
        icon: 'Package',
    },
    {
        id: 'on-time-rate',
        label: 'On-Time Delivery Rate',
        value: '87.3%',
        change: '-2.1% this week',
        trend: 'down',
        icon: 'Clock',
    },
    {
        id: 'disruption-alerts',
        label: 'Active Disruptions',
        value: '3',
        change: '+1 critical',
        trend: 'down',
        icon: 'AlertTriangle',
    },
    {
        id: 'revenue-at-risk',
        label: 'Revenue at Risk',
        value: '$4.2M',
        change: '+$1.8M since yesterday',
        trend: 'down',
        icon: 'DollarSign',
    },
];

// ─── Global Shipments Table ─────────────────────────────────────────────────

export const shipments: Shipment[] = [
    {
        id: 'SHP-78234',
        origin: 'Shanghai, CN',
        destination: 'Rotterdam, NL',
        carrier: 'Maersk Line',
        status: 'Delayed',
        eta: '2026-03-18',
        cargo: 'Electronics Components',
        value: '$2.4M',
    },
    {
        id: 'SHP-78235',
        origin: 'Shenzhen, CN',
        destination: 'Los Angeles, US',
        carrier: 'COSCO Shipping',
        status: 'At Risk',
        eta: '2026-03-22',
        cargo: 'Consumer Electronics',
        value: '$1.8M',
    },
    {
        id: 'SHP-78236',
        origin: 'Tokyo, JP',
        destination: 'Hamburg, DE',
        carrier: 'ONE Line',
        status: 'In Transit',
        eta: '2026-03-15',
        cargo: 'Automotive Parts',
        value: '$890K',
    },
    {
        id: 'SHP-78237',
        origin: 'Busan, KR',
        destination: 'Long Beach, US',
        carrier: 'HMM Co.',
        status: 'In Transit',
        eta: '2026-03-20',
        cargo: 'Semiconductor Wafers',
        value: '$3.1M',
    },
    {
        id: 'SHP-78238',
        origin: 'Singapore, SG',
        destination: 'Felixstowe, UK',
        carrier: 'Evergreen Marine',
        status: 'Customs Hold',
        eta: '2026-03-12',
        cargo: 'Pharmaceutical Ingredients',
        value: '$5.6M',
    },
    {
        id: 'SHP-78239',
        origin: 'Mumbai, IN',
        destination: 'New York, US',
        carrier: 'MSC',
        status: 'Delivered',
        eta: '2026-03-08',
        cargo: 'Textile Raw Materials',
        value: '$420K',
    },
    {
        id: 'SHP-78240',
        origin: 'Ho Chi Minh City, VN',
        destination: 'Vancouver, CA',
        carrier: 'Yang Ming',
        status: 'In Transit',
        eta: '2026-03-25',
        cargo: 'Furniture Components',
        value: '$670K',
    },
    {
        id: 'SHP-78241',
        origin: 'Kaohsiung, TW',
        destination: 'Antwerp, BE',
        carrier: 'Wan Hai Lines',
        status: 'At Risk',
        eta: '2026-03-19',
        cargo: 'Display Panels',
        value: '$4.7M',
    },
];

// ─── Critical Alert (Shanghai Port Strike) ──────────────────────────────────

export const criticalAlert: Alert = {
    id: 'ALT-001',
    severity: 'critical',
    title: 'Severe Port Strike — Shanghai Yangshan Port',
    description:
        'Major labor strike at Shanghai Yangshan Deep-Water Port has halted all container operations since March 2, 2026. Over 12,000 dockworkers have walked off the job, demanding improved safety protocols and wage increases. An estimated 340+ vessels are currently anchored or diverted. This disruption affects approximately 26% of global container throughput.',
    affectedRoutes: [
        'Shanghai → Rotterdam',
        'Shanghai → Los Angeles',
        'Shanghai → Hamburg',
        'Ningbo → Long Beach',
    ],
    estimatedImpact: '$4.2M in delayed revenue, 23 shipments affected',
    timestamp: '2026-03-02T08:30:00Z',
};

// ─── Crisis Resolution: Global Risk Scout Output ────────────────────────────

export const riskScoutData: RiskScoutData = {
    threatLevel: 'Critical',
    eventName: 'Shanghai Yangshan Port Labor Strike',
    eventDescription:
        'An unprecedented labor action has completely shut down the world\'s busiest container port. Negotiations between the Shanghai Port Authority and the Dockworkers Union have stalled, with no resolution expected for at least 7-14 days.',
    affectedPorts: [
        'Shanghai Yangshan (CNSHA)',
        'Shanghai Waigaoqiao (CNSHA)',
        'Ningbo-Zhoushan (CNNGB) — partial impact',
    ],
    weatherConditions: 'Typhoon season approaching (April). Secondary risk of weather-related delays for rerouted vessels in South China Sea corridor.',
    newsHeadlines: [
        'Reuters: "Shanghai Port Strike Enters Day 3, Global Supply Chains Brace for Fallout"',
        'Bloomberg: "Container Rates Surge 340% on Asia-Europe Routes Amid Port Chaos"',
        'Financial Times: "Manufacturers Scramble for Alternatives as China\'s Mega-Port Goes Dark"',
    ],
    geopoliticalFactors: [
        'Chinese New Year backlog still partially uncleared',
        'EU carbon border adjustment tariffs effective April 1',
        'US-China trade tensions may slow diplomatic intervention',
    ],
    estimatedDuration: '7-14 business days (conservative estimate)',
};

// ─── Crisis Resolution: Inventory Forecaster Output ─────────────────────────

export const inventoryImpact: InventoryImpact = {
    criticalItems: [
        {
            name: 'Li-Ion Battery Cells (Type 21700)',
            currentStock: 45000,
            dailyBurnRate: 8500,
            daysUntilDepletion: 5,
            reorderPoint: 25000,
            status: 'Critical',
        },
        {
            name: 'OLED Display Modules (6.7")',
            currentStock: 12000,
            dailyBurnRate: 3200,
            daysUntilDepletion: 4,
            reorderPoint: 10000,
            status: 'Critical',
        },
        {
            name: 'PCB Assembly Boards (Rev. C)',
            currentStock: 28000,
            dailyBurnRate: 2100,
            daysUntilDepletion: 13,
            reorderPoint: 8000,
            status: 'Warning',
        },
        {
            name: 'Aluminum Enclosure Shells',
            currentStock: 67000,
            dailyBurnRate: 1800,
            daysUntilDepletion: 37,
            reorderPoint: 15000,
            status: 'Stable',
        },
    ],
    totalSkusAffected: 147,
    revenueAtRisk: '$4.2M',
    productionLineImpact: '2 of 5 assembly lines will halt within 5 days without intervention',
};

// ─── Crisis Resolution: Routing Strategist Plans ────────────────────────────

export const mitigationPlans: MitigationPlan[] = [
    {
        id: 'plan-a',
        name: 'Plan A',
        strategy: 'Wait & Monitor',
        description: 'Maintain current routing and wait for strike resolution. Deploy safety stock buffers.',
        estimatedCost: '$0 (absorbed by existing buffers)',
        timeframe: '7-14 days',
        riskLevel: 'High',
        co2Impact: 'No change',
        reliabilityScore: 35,
        details: [
            'Zero additional logistics cost',
            'Relies on strike resolving within 14 days',
            'Production lines 1 & 3 will halt by day 5',
            'Customer SLA breaches likely for 23 orders',
            'Suitable only if strike resolution is imminent',
        ],
    },
    {
        id: 'plan-b',
        name: 'Plan B',
        strategy: 'Reroute via Rail (China-Europe Express)',
        description: 'Divert critical cargo to the China-Europe railway corridor via Chengdu, utilizing the Chengdu-Łódź rail link.',
        estimatedCost: '$340,000 — $410,000',
        timeframe: '12-16 days',
        riskLevel: 'Medium',
        co2Impact: '-18% vs. original sea route',
        reliabilityScore: 72,
        details: [
            'Rail capacity available: ~120 TEU on next departure (March 6)',
            'Covers battery cells & display modules (critical items)',
            'Customs clearance at Małaszewicze (PL) adds 1-2 days',
            'Moderate cost increase but avoids production halt',
            'Proven corridor with 94% historical reliability',
        ],
    },
    {
        id: 'plan-c',
        name: 'Plan C',
        strategy: 'Emergency Air Freight',
        description: 'Charter dedicated cargo aircraft (Boeing 747F) from Shanghai Pudong to destination hubs for most time-critical components.',
        estimatedCost: '$890,000 — $1,120,000',
        timeframe: '2-3 days',
        riskLevel: 'Low',
        co2Impact: '+580% vs. original sea route',
        reliabilityScore: 95,
        details: [
            'Fastest resolution — components arrive within 72 hours',
            'Highest cost but eliminates production downtime risk',
            'Air freight capacity confirmed with Cargolux & Cathay Cargo',
            'Only viable for highest-priority SKUs due to volume limits',
            'Full SLA compliance maintained for all customer orders',
        ],
    },
];

// ─── Default Agent Configuration ────────────────────────────────────────────

export const defaultAgentConfig: AgentConfig = {
    riskToleranceLevel: 5,
    maxAirFreightBudget: 250000,
    minSafetyStockDays: 14,
    autoRerouteEnabled: false,
    preferredCarrier: 'any',
    notificationFrequency: 'hourly',
    costOptimizationMode: 'balanced',
};
