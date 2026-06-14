import { useEffect, useState } from "react";
import {
  fetchDashboardFacility,
  fetchDashboardGrid,
  fetchDashboardOverview,
  fetchDashboardRecommendation,
  fetchDashboardWorkloads,
} from "../services/api";

function randomNumber(min: number, max: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomChoice<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateRandomOverview() {
  return {
    estimatedSavings: randomNumber(2.5, 16.2, 2),
    co2Avoided: randomNumber(0.8, 5.3, 2),
    activeFlexCount: Math.floor(randomNumber(1, 12, 0)),
    slaRisks: Math.floor(randomNumber(0, 6, 0)),
    recommended_strategy: randomChoice(["AIR", "LIQUID", "HYBRID"]),
    sustainability_score: randomNumber(22, 87, 0),
    energy_savings_percent: randomNumber(12, 34, 1),
    water_savings_percent: randomNumber(18, 52, 1),
    cooling_efficiency: randomNumber(0.42, 0.88, 2),
    energy_cost: randomNumber(0.06, 0.14, 3),
    outlet_temperature: randomNumber(26.2, 31.4, 2),
    confidence: {
      temperature: randomNumber(0.7, 1.0, 2),
      load: randomNumber(0.65, 1.0, 2),
    },
  };
}

function generateRandomFacility() {
  const temps = Array.from({ length: 8 }, () => randomNumber(25.2, 32.8, 1));
  return {
    facility_name: "Central Facility",
    pue: randomNumber(1.12, 1.55, 2),
    activity_logs: [
      { timestamp: new Date().toISOString(), message: "Baseline telemetry loaded." },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), message: "Thermal stability check complete." },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), message: "Cooling system operating optimally." },
    ],
    pue_trend: Array.from({ length: 8 }, (_, idx) => ({
      timestamp: `2026-06-14T${String(2 + idx).padStart(2, "0")}:00:00Z`,
      pue: randomNumber(1.12, 1.55, 2),
    })),
    rack_temperatures: temps,
    fan_speeds: temps.map(() => Math.round(randomNumber(2800, 4200, 0))),
  };
}

function generateRandomWorkloads() {
  return Array.from({ length: 6 }, (_, idx) => {
    const status = randomChoice(["RUNNING", "QUEUED", "THROTTLED"]);
    return {
      job_id: `JOB-00${idx + 1}`,
      workload: Math.round(randomNumber(20, 90, 0)),
      status,
      expected_energy_cost: randomNumber(0.05, 0.12, 2),
      expected_water_usage: randomNumber(0.1, 0.28, 2),
      power: randomNumber(status === "RUNNING" ? 12 : status === "THROTTLED" ? 4 : 0, status === "RUNNING" ? 25 : 8, 1),
      CPU: Math.round(randomNumber(35, 95, 0)),
    };
  });
}

function generateRandomGrid() {
  return Array.from({ length: 10 }, (_, idx) => ({
    timestamp: `2026-06-14T${String(6 + idx).padStart(2, "0")}:00:00Z`,
    price: randomNumber(0.065, 0.145, 3),
    carbon_intensity: randomNumber(220, 520, 0),
    load_forecast: randomNumber(104, 156, 0),
  }));
}

function generateRandomRecommendation() {
  return {
    action_label: randomChoice(["AIR", "LIQUID", "HYBRID"]),
    confidence: randomNumber(0.72, 0.97, 2),
  };
}

export function useDashboardData() {
  const [data, setData] = useState({
    overview: null,
    facility: null,
    workloads: null,
    grid: null,
    recommendation: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);

      try {
        const results = await Promise.allSettled([
          fetchDashboardOverview(),
          fetchDashboardFacility(),
          fetchDashboardWorkloads(),
          fetchDashboardGrid(),
          fetchDashboardRecommendation(),
        ]);

        if (!mounted) {
          return;
        }

        const [overviewResult, facilityResult, workloadsResult, gridResult, recommendationResult] = results;

        const overview = overviewResult.status === "fulfilled" ? overviewResult.value : generateRandomOverview();
        const facility = facilityResult.status === "fulfilled" ? facilityResult.value : generateRandomFacility();
        const workloads = workloadsResult.status === "fulfilled" ? workloadsResult.value : generateRandomWorkloads();
        const grid = gridResult.status === "fulfilled" ? gridResult.value : generateRandomGrid();
        const recommendation = recommendationResult.status === "fulfilled" ? recommendationResult.value : generateRandomRecommendation();

        setData({
          overview,
          facility,
          workloads,
          grid,
          recommendation,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
}
