import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";

type UserRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  role: "anggota" | "pengurus";
  is_active: boolean;
};

export default function User() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openNote, setOpenNote] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [notes, setNotes] = useState<
    Array<{
      id: string;
      notes: string;
      payment_date: string;
      created_at: string;
      status: string;
    }>
  >([]);

  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    formState: { isSubmitting: isSubmittingNote },
    setValue: setNoteValue,
  } = useForm<{ notes: string; date: string }>({
    defaultValues: {
      notes: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{
    full_name: string;
    email?: string;
    phone: string;
    role: "anggota" | "pengurus";
    is_active: boolean;
  }>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "anggota",
      is_active: true,
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, phone, role, is_active")
        .order("full_name", { ascending: true });
      if (!error && data && mounted) {
        setUsers(data as unknown as UserRow[]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = users.filter((u) => {
    const q = (search || "").toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      String(u.role || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, full_name, phone, role, is_active")
      .order("full_name", { ascending: true });
    setUsers((data || []) as unknown as UserRow[]);
    setLoading(false);
  };

  const onCreate = handleSubmit(async (values) => {
    const payload = {
      full_name: values.full_name?.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim(),
      role: values.role,
      is_active: !!values.is_active,
    };
    if (payload.role === "pengurus" && !payload.email) {
      console.error("Email wajib untuk role pengurus");
      return;
    }
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser || !authUser.user) {
      console.error(
        "Tidak ada sesi Supabase Auth. Admin harus login untuk membuat user.",
      );
      return;
    }
    const { error } = await supabase.rpc("admin_insert_user", payload);
    if (!error) {
      await refresh();
      setOpenCreate(false);
      reset();
    } else {
      console.error(error);
    }
  });

  const loadNotes = async (userId: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select("id, notes, payment_date, created_at, status")
      .eq("user_id", userId)
      .is("loan_id", null)
      .is("payment_type", null)
      .not("notes", "is", null)
      .order("created_at", { ascending: false });
    if (error) return;
    const rows = (data || []) as Array<{
      id: string;
      notes: string | null;
      payment_date: string | null;
      created_at: string | null;
      status: string | null;
    }>;
    setNotes(
      rows.map((d) => ({
        id: d.id,
        notes: String(d.notes || ""),
        payment_date: String(d.payment_date || ""),
        created_at: String(d.created_at || ""),
        status: String(d.status || ""),
      })),
    );
  };

  const openNotesForUser = async (u: { id: string; full_name: string }) => {
    setSelectedUser(u);
    setOpenNote(true);
    setNoteValue("notes", "");
    setNoteValue("date", new Date().toISOString().split("T")[0]);
    await loadNotes(u.id);
  };

  const onCreateNote = handleSubmitNote(async (values) => {
    if (!selectedUser) return;
    const { notes: noteText, date } = values;
    const { error } = await supabase.from("payments").insert({
      user_id: selectedUser.id,
      loan_id: null,
      amount: 0,
      payment_type: null,
      payment_category: null,
      payment_date: date,
      status: "pending",
      notes: noteText,
    });
    if (!error) {
      await loadNotes(selectedUser.id);
      resetNote();
    } else {
      console.error(error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Anggota & Pengurus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Cari</Label>
            <Input
              placeholder="Cari nama, phone, atau role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between md:justify-end gap-2">
            <span className="text-sm text-muted-foreground">
              Total: {users.length} {loading ? "(memuat...)" : ""}
            </span>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button size="sm">Tambah User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah User</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onCreate}>
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input
                      placeholder="Nama lengkap"
                      {...register("full_name", { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="nama@domain.com"
                      type="email"
                      {...register("email")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor HP</Label>
                    <Input placeholder="08xxxx" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      {...register("role", { required: true })}
                    >
                      <option value="anggota">Anggota</option>
                      <option value="pengurus">Pengurus</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-input"
                      {...register("is_active")}
                    />
                    <Label>Aktif</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name || "-"}</TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-2 py-1 text-xs ${
                        u.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openNotesForUser({ id: u.id, full_name: u.full_name })
                      }
                    >
                      Catatan Pinjaman
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={openNote} onOpenChange={setOpenNote}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Catatan Pinjaman{" "}
                {selectedUser ? `— ${selectedUser.full_name}` : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <form className="space-y-3" onSubmit={onCreateNote}>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    {...registerNote("date", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Masukkan catatan pengurus terkait rencana pinjaman"
                    {...registerNote("notes", { required: true })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmittingNote}>
                    {isSubmittingNote ? "Menyimpan..." : "Simpan Catatan"}
                  </Button>
                </DialogFooter>
              </form>
              <div className="space-y-2">
                <Label>Daftar Catatan</Label>
                <div className="rounded border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tgl</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell>{n.payment_date || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {n.notes || "-"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {n.status || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {notes.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground py-4"
                          >
                            Belum ada catatan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
