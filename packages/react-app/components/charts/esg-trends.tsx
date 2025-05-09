'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data - replace with actual data from API
const data = [
  {
    period: "Q1-2023",
    plasticFootprint: 5000,
    recycledContent: 25,
    carbonReduction: 120,
    waterConservation: 800,
  },
  {
    period: "Q2-2023",
    plasticFootprint: 4800,
    recycledContent: 30,
    carbonReduction: 150,
    waterConservation: 1000,
  },
  {
    period: "Q3-2023",
    plasticFootprint: 4500,
    recycledContent: 35,
    carbonReduction: 180,
    waterConservation: 1200,
  },
  {
    period: "Q4-2023",
    plasticFootprint: 4200,
    recycledContent: 40,
    carbonReduction: 200,
    waterConservation: 1400,
  },
  {
    period: "Q1-2024",
    plasticFootprint: 4000,
    recycledContent: 45,
    carbonReduction: 220,
    waterConservation: 1600,
  },
];

export function ESGTrends() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>ESG Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tickFormatter={(value) => {
                  return value.replace("-", " ");
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#16a34a"
                label={{ value: "Plastic Footprint (kg)", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#2563eb"
                label={{ value: "Recycled Content (%)", angle: 90, position: "insideRight" }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "plasticFootprint") return [`${value} kg`, "Plastic Footprint"];
                  if (name === "recycledContent") return [`${value}%`, "Recycled Content"];
                  if (name === "carbonReduction") return [`${value} tCO2e`, "Carbon Reduction"];
                  if (name === "waterConservation") return [`${value} m³`, "Water Conservation"];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="plasticFootprint"
                stroke="#16a34a"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="recycledContent"
                stroke="#2563eb"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="carbonReduction"
                stroke="#dc2626"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="waterConservation"
                stroke="#0891b2"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 