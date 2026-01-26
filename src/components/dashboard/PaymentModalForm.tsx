import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = {
  userId: string;
  category: "wajib" | "infaq" | "tabungan";
  amount: number;
  date: string;
  notes: string;
  paymentType: "monthly" | "partial" | "full";
  loanId?: string;
};

export function PaymentModalForm({ onSuccess }: { onSuccess?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      userId: "",
      category: "wajib",
      amount: undefined as unknown as number,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      paymentType: "monthly",
      loanId: "",
    },
  });
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>(
    [],
  );
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
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "anggota");
      if (mounted)
        setUsers((data || []) as Array<{ id: string; full_name: string }>);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedUserId = watch("userId");
  const selectedLoanId = watch("loanId");
  const selectedPaymentType = watch("paymentType");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!selectedUserId) {
        setLoans([]);
        return;
      }
      const { data } = await supabase
        .from("loans")
        .select("id, monthly_payment, duration_months, amount, status")
        .eq("user_id", selectedUserId)
        .eq("status", "active");
      if (active)
        setLoans(
          (data || []) as Array<{
            id: string;
            monthly_payment: number;
            duration_months: number;
            amount: number;
            status: string;
          }>,
        );
    })();
    return () => {
      active = false;
    };
  }, [selectedUserId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!selectedLoanId) {
        setSumPaid(0);
        return;
      }
      const { data } = await supabase
        .from("payments")
        .select("amount, status, loan_id")
        .eq("loan_id", selectedLoanId)
        .eq("status", "completed");
      const payments = (data || []) as Array<{ amount: number | string }>;
      const total = payments.reduce(
        (acc: number, p) => acc + Number(p.amount ?? 0),
        0,
      );
      if (active) setSumPaid(total);
    })();
    return () => {
      active = false;
    };
  }, [selectedLoanId]);

  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId),
    [loans, selectedLoanId],
  );

  useEffect(() => {
    if (selectedPaymentType === "monthly" && selectedLoan?.monthly_payment) {
      setValue("amount", Number(selectedLoan.monthly_payment));
    }
  }, [selectedPaymentType, selectedLoan, setValue]);

  const onSubmit = async (values: FormValues) => {
    const { userId, amount, category, date, notes, loanId, paymentType } =
      values;
    const isLoanPayment = !!loanId;
    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      amount: Number(amount),
      payment_category: isLoanPayment ? null : category,
      payment_type: isLoanPayment ? paymentType : null,
      loan_id: isLoanPayment ? loanId : null,
      payment_date: date,
      notes,
      status: "completed",
    });
    if (error) throw error;
    await supabase.from("balance_history").insert({
      user_id: userId,
      balance_amount: Number(amount),
      transaction_type: isLoanPayment ? "loan_payment" : category,
      payment_category: isLoanPayment ? null : category,
      description: isLoanPayment
        ? `Pembayaran Pinjaman (${paymentType})`
        : `Payment: ${category}`,
      transaction_date: date,
    });

    if (isLoanPayment && selectedLoan) {
      const expectedTotal =
        Number(selectedLoan.monthly_payment || 0) *
        Number(selectedLoan.duration_months || 0);
      const newSum = sumPaid + Number(amount);
      if (newSum >= expectedTotal && selectedLoan.status === "active") {
        await supabase
          .from("loans")
          .update({ status: "paid" })
          .eq("id", loanId);
      }
    }
    reset();
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Anggota</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("userId", { required: true })}
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
          {...register("paymentType", { required: true })}
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
          {...register("loanId")}
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
        {selectedLoan && (
          <div className="text-xs text-muted-foreground">
            Total kewajiban: Rp{" "}
            {Number(
              (selectedLoan.monthly_payment || 0) *
                (selectedLoan.duration_months || 0),
            ).toLocaleString()}{" "}
            • Sudah dibayar: Rp {sumPaid.toLocaleString()} • Sisa: Rp{" "}
            {Math.max(
              0,
              Number(
                (selectedLoan.monthly_payment || 0) *
                  (selectedLoan.duration_months || 0) -
                  sumPaid,
              ),
            ).toLocaleString()}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Kategori Pembayaran</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("category", { required: true })}
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
          {...register("amount", { required: true, valueAsNumber: true })}
          readOnly={!!selectedLoan && selectedPaymentType === "monthly"}
        />
      </div>
      <div className="space-y-2">
        <Label>Tanggal</Label>
        <Input type="date" {...register("date", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label>Catatan</Label>
        <Input {...register("notes")} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Simpan Pembayaran"}
      </Button>
    </form>
  );
}
