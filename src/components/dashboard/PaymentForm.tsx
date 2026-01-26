import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentForm() {
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    category: "wajib",
    loanId: "",
    paymentType: "monthly",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loans, setLoans] = useState<
    Array<{
      id: string;
      monthly_payment: number;
      duration_months: number;
      amount: number;
      status: string;
    }>
  >([]);
  const [sumPaid, setSumPaid] = useState<number>(0);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "anggota");
      setUsers((data || []) as Array<{ id: string; full_name: string }>);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchLoans() {
      if (!formData.userId) {
        setLoans([]);
        return;
      }
      const { data } = await supabase
        .from("loans")
        .select("id, monthly_payment, duration_months, amount, status")
        .eq("user_id", formData.userId)
        .eq("status", "active");
      setLoans(
        (data || []) as Array<{
          id: string;
          monthly_payment: number;
          duration_months: number;
          amount: number;
          status: string;
        }>,
      );
    }
    fetchLoans();
  }, [formData.userId]);

  useEffect(() => {
    async function fetchSumPaid() {
      if (!formData.loanId) {
        setSumPaid(0);
        return;
      }
      const { data } = await supabase
        .from("payments")
        .select("amount, status, loan_id")
        .eq("loan_id", formData.loanId)
        .eq("status", "completed");
      const payments = (data || []) as Array<{ amount: number | string }>;
      const total = payments.reduce(
        (acc: number, p) => acc + Number(p.amount ?? 0),
        0,
      );
      setSumPaid(total);
    }
    fetchSumPaid();
  }, [formData.loanId]);

  useEffect(() => {
    const loan = loans.find((l) => l.id === formData.loanId);
    if (formData.paymentType === "monthly" && loan?.monthly_payment) {
      setFormData((prev) => ({
        ...prev,
        amount: String(loan.monthly_payment),
      }));
    }
  }, [formData.paymentType, formData.loanId, loans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isLoanPayment = !!formData.loanId;
      const { error } = await supabase.from("payments").insert({
        user_id: formData.userId,
        amount: Number(formData.amount),
        payment_category: isLoanPayment ? null : formData.category,
        payment_type: isLoanPayment ? formData.paymentType : null,
        loan_id: isLoanPayment ? formData.loanId : null,
        payment_date: formData.date,
        notes: formData.notes,
        status: "completed",
      });

      if (error) throw error;

      // Update balance history
      await supabase.from("balance_history").insert({
        user_id: formData.userId,
        balance_amount: Number(formData.amount),
        transaction_type: isLoanPayment ? "loan_payment" : formData.category,
        payment_category: isLoanPayment ? null : formData.category,
        description: isLoanPayment
          ? `Pembayaran Pinjaman (${formData.paymentType})`
          : `Payment: ${formData.category}`,
        transaction_date: formData.date,
      });

      if (isLoanPayment) {
        const loan = loans.find((l) => l.id === formData.loanId);
        if (loan) {
          const expectedTotal =
            Number(loan.monthly_payment || 0) *
            Number(loan.duration_months || 0);
          const newSum = sumPaid + Number(formData.amount || 0);
          if (newSum >= expectedTotal && loan.status === "active") {
            await supabase
              .from("loans")
              .update({ status: "paid" })
              .eq("id", formData.loanId);
          }
        }
      }

      alert("Payment recorded successfully!");
      setFormData({ ...formData, amount: "", notes: "", loanId: "" });
    } catch (err) {
      const e = err as { message?: string };
      alert("Error recording payment: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catat Pembayaran Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Anggota</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              required
            >
              <option value="">Pilih Anggota</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Jenis Pembayaran</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.paymentType}
              onChange={(e) =>
                setFormData({ ...formData, paymentType: e.target.value })
              }
            >
              <option value="monthly">Cicilan Bulanan</option>
              <option value="partial">Pembayaran Parsial</option>
              <option value="full">Pelunasan Penuh</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Pilih Pinjaman (Aktif)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.loanId}
              onChange={(e) =>
                setFormData({ ...formData, loanId: e.target.value })
              }
            >
              <option value="">— Tanpa Pinjaman —</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id.slice(0, 6)} • Cicilan Rp{" "}
                  {Number(l.monthly_payment || 0).toLocaleString()} • Durasi{" "}
                  {l.duration_months} bln
                </option>
              ))}
            </select>
            {formData.loanId &&
              (() => {
                const loan = loans.find((l) => l.id === formData.loanId);
                if (!loan) return null;
                const total = Number(
                  (loan.monthly_payment || 0) * (loan.duration_months || 0),
                );
                const sisa = Math.max(0, total - sumPaid);
                return (
                  <div className="text-xs text-muted-foreground">
                    Total kewajiban: Rp {total.toLocaleString()} • Sudah
                    dibayar: Rp {sumPaid.toLocaleString()} • Sisa: Rp{" "}
                    {sisa.toLocaleString()}
                  </div>
                );
              })()}
          </div>

          <div className="space-y-2">
            <Label>Kategori Pembayaran</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="wajib">Bulanan (Wajib)</option>
              <option value="infaq">Infaq (Optional)</option>
              <option value="tabungan">Tabungan (Optional)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Jumlah (Rp)</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              readOnly={!!formData.loanId && formData.paymentType === "monthly"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Simpan Pembayaran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
