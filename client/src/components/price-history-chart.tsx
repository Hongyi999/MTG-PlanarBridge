/**
 * Price History Chart Component
 *
 * Displays multi-currency price trends for MTG cards using Recharts.
 * Features:
 * - Multiple source lines (Scryfall, TCGTracking, JustTCG)
 * - CNY estimated price line
 * - Time period selector (7d / 30d / 90d / All)
 * - Interactive tooltips with date, price, and source info
 * - Empty state when no data available
 */

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getPriceHistory, type PriceHistoryEntry } from "@/lib/api";
import { useState } from "react";

interface PriceHistoryChartProps {
  scryfallId: string;
  cardName?: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  // USD prices from different sources
  usdScryfall: number | null;
  usdTCGTracking: number | null;
  usdJustTCG: number | null;
  // CNY (estimated from USD * exchangeRate)
  cnyEstimated: number | null;
}

const SOURCE_COLORS = {
  scryfall: "hsl(var(--chart-1))",
  tcgtracking: "hsl(var(--chart-2))",
  justtcg: "hsl(var(--chart-3))",
};

const CURRENCY_COLORS = {
  cny: "hsl(24, 95%, 53%)",       // Orange
};

export function PriceHistoryChart({ scryfallId, cardName }: PriceHistoryChartProps) {
  const [timePeriod, setTimePeriod] = useState<number>(30); // days

  const { data: history, isLoading } = useQuery<PriceHistoryEntry[]>({
    queryKey: ["price-history", scryfallId, timePeriod],
    queryFn: () => getPriceHistory(scryfallId, timePeriod),
  });

  // Transform raw data to chart format
  const chartData: ChartDataPoint[] = (history || []).map((entry) => {
    const usd = entry.priceUsd || entry.priceUsdFoil;
    const cnyEstimated = usd && entry.exchangeRateUsdCny
      ? usd * entry.exchangeRateUsdCny
      : null;

    return {
      date: format(new Date(entry.recordedAt), "MM/dd"),
      timestamp: new Date(entry.recordedAt).getTime(),
      usdScryfall: entry.source === "scryfall" ? entry.priceUsd : null,
      usdTCGTracking: entry.source === "tcgtracking" ? entry.priceUsd : null,
      usdJustTCG: entry.source === "justtcg" ? entry.priceUsd : null,
      cnyEstimated,
    };
  });

  // Group by date to combine multiple sources
  const groupedData = chartData.reduce((acc, point) => {
    const existing = acc.find((p) => p.date === point.date);
    if (existing) {
      if (point.usdScryfall) existing.usdScryfall = point.usdScryfall;
      if (point.usdTCGTracking) existing.usdTCGTracking = point.usdTCGTracking;
      if (point.usdJustTCG) existing.usdJustTCG = point.usdJustTCG;
      if (point.cnyEstimated) existing.cnyEstimated = point.cnyEstimated;
    } else {
      acc.push(point);
    }
    return acc;
  }, [] as ChartDataPoint[]);

  // Sort by timestamp
  groupedData.sort((a, b) => a.timestamp - b.timestamp);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">价格趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">价格趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-sm">暂无价格历史数据</p>
            <p className="text-xs mt-2">请关注此卡，系统将自动收集价格数据</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">价格趋势</CardTitle>
        <Tabs value={timePeriod.toString()} onValueChange={(v) => setTimePeriod(parseInt(v))}>
          <TabsList className="h-8">
            <TabsTrigger value="7" className="text-xs">7天</TabsTrigger>
            <TabsTrigger value="30" className="text-xs">30天</TabsTrigger>
            <TabsTrigger value="90" className="text-xs">90天</TabsTrigger>
            <TabsTrigger value="365" className="text-xs">全部</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="text-xs font-medium">
                        {payload[0]?.payload?.date}
                      </div>
                      {payload.map((entry: any, index: number) => {
                        if (!entry.value) return null;
                        let label = entry.name;
                        let currency = "$";
                        const value = entry.value;

                        if (entry.name === "usdScryfall") {
                          label = "Scryfall";
                          currency = "$";
                        } else if (entry.name === "usdTCGTracking") {
                          label = "TCGTracking";
                          currency = "$";
                        } else if (entry.name === "usdJustTCG") {
                          label = "JustTCG";
                          currency = "$";
                        } else if (entry.name === "cnyEstimated") {
                          label = "CNY (估算)";
                          currency = "¥";
                        }

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">{label}:</span>
                            </div>
                            <span className="font-mono font-medium">
                              {currency}{typeof value === "number" ? value.toFixed(2) : value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => {
                if (value === "usdScryfall") return "USD (Scryfall)";
                if (value === "usdTCGTracking") return "USD (TCGTracking)";
                if (value === "usdJustTCG") return "USD (JustTCG)";
                if (value === "cnyEstimated") return "CNY (估算)";
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="usdScryfall"
              stroke={SOURCE_COLORS.scryfall}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
              name="usdScryfall"
            />
            <Line
              type="monotone"
              dataKey="usdTCGTracking"
              stroke={SOURCE_COLORS.tcgtracking}
              strokeWidth={2}
              dot={{ r: 3 }}
              strokeDasharray="5 5"
              connectNulls
              name="usdTCGTracking"
            />
            <Line
              type="monotone"
              dataKey="usdJustTCG"
              stroke={SOURCE_COLORS.justtcg}
              strokeWidth={2}
              dot={{ r: 3 }}
              strokeDasharray="3 6"
              connectNulls
              name="usdJustTCG"
            />
            <Line
              type="monotone"
              dataKey="cnyEstimated"
              stroke={CURRENCY_COLORS.cny}
              strokeWidth={1.5}
              dot={{ r: 2 }}
              strokeDasharray="3 3"
              connectNulls
              name="cnyEstimated"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
