import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BalanceChart } from "@/components/dashboard/BalanceChart";
import { Users, CreditCard, Wallet, TrendingUp } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalLoans: 0,
    totalBalance: 0,
    totalInfaq: 0,
    totalTabungan: 0,
  });
  const [chartData, setChartData] = useState<
    { name: string; balance: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // ... (existing fetch logic) ...

        // Fetch Total Members
        const { count: membersCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "anggota")
          .eq("is_active", true);

        // Fetch Total Active Loans Amount
        const { data: loansData } = await supabase
          .from("loans")
          .select("amount")
          .eq("status", "active");

        const totalLoansAmount =
          loansData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        // Fetch Total Balance
        const { data: balanceData } = await supabase
          .from("balance_history")
          .select("balance_amount")
          .order("transaction_date", { ascending: false })
          .limit(1);

        const currentBalance = balanceData?.[0]?.balance_amount || 0;

        // Fetch Optional Payments (Infaq & Tabungan) for selected month/year
        const startOfMonth = new Date(
          selectedYear,
          selectedMonth - 1,
          1,
        ).toISOString();
        const endOfMonth = new Date(
          selectedYear,
          selectedMonth,
          0,
        ).toISOString();

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("amount, payment_category")
          .gte("payment_date", startOfMonth)
          .lte("payment_date", endOfMonth)
          .in("payment_category", ["infaq", "tabungan", "wajib"]);

        const totalInfaq =
          paymentsData
            ?.filter((p) => p.payment_category === "infaq")
            .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        const totalTabungan =
          paymentsData
            ?.filter((p) => p.payment_category === "tabungan")
            .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        setStats({
          totalMembers: membersCount || 0,
          totalLoans: totalLoansAmount,
          totalBalance: Number(currentBalance),
          totalInfaq,
          totalTabungan,
        });

        // Dummy Chart Data for now (replace with actual historical data fetching if available)
        setChartData([
          { name: "Jan", balance: 10000000 },
          { name: "Feb", balance: 15000000 },
          { name: "Mar", balance: 12000000 },
          { name: "Apr", balance: 18000000 },
          { name: "May", balance: 22000000 },
          { name: "Jun", balance: 25000000 },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Koperasi Dashboard
          </h1>
          <div className="text-sm text-muted-foreground">
            Overview Keuangan Koperasi
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-1.5 text-xs font-semibold focus:ring-0"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("default", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-1.5 text-xs font-semibold focus:ring-0"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          className="bg-white"
          title="Total Saldo"
          value={formatCurrency(stats.totalBalance)}
          description="Total aset keuangan saat ini"
          icon={Wallet}
        />
        <StatsCard
          title="Pinjaman Aktif"
          value={formatCurrency(stats.totalLoans)}
          description="Total nilai pinjaman beredar"
          icon={CreditCard}
        />
        <StatsCard
          title="Anggota Aktif"
          value={stats.totalMembers}
          description="Jumlah anggota terdaftar"
          icon={Users}
        />
        <StatsCard
          title="Infaq Bulan Ini"
          value={formatCurrency(stats.totalInfaq)}
          description="Total penerimaan infaq"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <BalanceChart data={chartData} />

        <div className="col-span-3 grid gap-4">
          <StatsCard
            title="Tabungan Bulan Ini"
            value={formatCurrency(stats.totalTabungan)}
            description="Total tabungan sukarela masuk"
            icon={Wallet}
            className="h-full"
          />
          {/* Additional widgets can go here */}
        </div>
      </div>
    </div>
  );
}
