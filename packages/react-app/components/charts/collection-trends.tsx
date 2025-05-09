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
    weight: 1200,
    collectors: 15,
  },
  {
    date: "2024-02",
    weight: 1500,
    collectors: 18,
  },
  {
    date: "2024-03",
    weight: 1800,
    collectors: 22,
  },
  {
    date: "2024-04",
    weight: 2200,
    collectors: 25,
  },
  {
    date: "2024-05",
    weight: 2500,
    collectors: 28,
  },
  {
    date: "2024-06",
    weight: 2800,
    collectors: 30,
  },
];

export function CollectionTrends() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Collection Trends</CardTitle>
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
                label={{ value: "Total Weight (kg)", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#2563eb"
                label={{ value: "Active Collectors", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "weight") return [`${value} kg`, "Total Weight"];
                  if (name === "collectors") return [value, "Active Collectors"];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                stroke="#16a34a"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="collectors"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 