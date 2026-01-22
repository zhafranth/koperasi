import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChartData {
  name: string;
  balance: number;
}

interface BalanceChartProps {
  data: ChartData[];
  title?: string;
  description?: string;
}

export function BalanceChart({
  data,
  title = "Financial Overview",
  description = "Balance trend over time",
}: BalanceChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6d8c7c" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6d8c7c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp${value}`}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <Tooltip
                formatter={(value) => [
                  `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`,
                  "Balance",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#6d8c7c"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
