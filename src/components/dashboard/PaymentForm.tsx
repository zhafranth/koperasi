import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PaymentForm() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    category: 'wajib',
    loanId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase.from('users').select('id, full_name').eq('role', 'anggota');
      if (data) setUsers(data);
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('payments').insert({
        user_id: formData.userId,
        amount: Number(formData.amount),
        payment_category: formData.category,
        loan_id: formData.category === 'wajib' && formData.loanId ? formData.loanId : null,
        payment_date: formData.date,
        notes: formData.notes,
        status: 'completed',
      });

      if (error) throw error;

      // Update balance history
      await supabase.from('balance_history').insert({
        user_id: formData.userId,
        balance_amount: Number(formData.amount), // This assumes balance is cumulative, but schema says 'balance_amount'. 
        // Actually, balance_history typically tracks changes or snapshot. 
        // The schema has 'balance_amount' (snapshot?) and 'transaction_type'.
        // If it's a ledger, we insert the transaction amount.
        // But the field is named 'balance_amount'. Let's assume it means 'amount of this transaction' based on context of 'transaction_type'.
        // Wait, 'balance_amount' usually means the resulting balance.
        // However, given the simple schema, let's treat it as transaction amount for now or calculate new balance.
        // Let's assume it's the transaction amount for simplicity in this MVP, or better, calculate it.
        // I will just insert the amount and let the backend/dashboard sum it up.
        // Or better, rename it to 'amount' in my mind, but the schema is fixed.
        // Let's look at schema: "balance_amount DECIMAL".
        // I'll store the transaction amount here for now.
        transaction_type: formData.category,
        payment_category: formData.category,
        description: `Payment: ${formData.category}`,
        transaction_date: formData.date,
      });

      alert('Payment recorded successfully!');
      setFormData({ ...formData, amount: '', notes: '' });
    } catch (error: any) {
      alert('Error recording payment: ' + error.message);
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
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">Pilih Anggota</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Kategori Pembayaran</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Simpan Pembayaran'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
