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
    date: "2024-01",
    inputWeight: 5000,
    outputWeight: 4500,
    efficiency: 90,
  },
  {
    date: "2024-02",
    inputWeight: 5500,
    outputWeight: 4950,
    efficiency: 90,
  },
  {
    date: "2024-03",
    inputWeight: 6000,
    outputWeight: 5400,
    efficiency: 90,
  },
  {
    date: "2024-04",
    inputWeight: 6500,
    outputWeight: 5850,
    efficiency: 90,
  },
  {
    date: "2024-05",
    inputWeight: 7000,
    outputWeight: 6300,
    efficiency: 90,
  },
  {
    date: "2024-06",
    inputWeight: 7500,
    outputWeight: 6750,
    efficiency: 90,
  },
];

export function ProcessingTrends() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Processing Trends</CardTitle>
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
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("default", {
                    month: "short",
                    year: "2-digit",
                  });
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#16a34a"
                label={{ value: "Weight (kg)", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#2563eb"
                label={{ value: "Efficiency (%)", angle: 90, position: "insideRight" }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "inputWeight") return [`${value} kg`, "Input Weight"];
                  if (name === "outputWeight") return [`${value} kg`, "Output Weight"];
                  if (name === "efficiency") return [`${value}%`, "Processing Efficiency"];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inputWeight"
                stroke="#16a34a"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="outputWeight"
                stroke="#22c55e"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 