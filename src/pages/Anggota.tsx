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

type AnggotaRow = {
  id: string;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  status: "aktif" | "nonaktif";
};

export default function Anggota() {
  const [rows, setRows] = useState<AnggotaRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{
    full_name: string;
    phone?: string;
    address?: string;
    status: "aktif" | "nonaktif";
  }>({
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      status: "aktif",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("anggota")
      .select("id, full_name, phone, address, status")
      .order("full_name", { ascending: true });
    if (!error) {
      setRows((data || []) as AnggotaRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchData();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = rows.filter((r) => {
    const q = (search || "").toLowerCase();
    return (
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.address || "").toLowerCase().includes(q) ||
      String(r.status || "").toLowerCase().includes(q)
    );
  });

  const onCreate = handleSubmit(async (values) => {
    const payload = {
      full_name: values.full_name?.trim(),
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
      status: values.status,
    };
    const { error } = await supabase.from("anggota").insert(payload);
    if (!error) {
      await fetchData();
      setOpenCreate(false);
      reset();
    } else {
      console.error(error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Anggota</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Cari</Label>
            <Input
              placeholder="Cari nama, phone, alamat, atau status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between md:justify-end gap-2">
            <span className="text-sm text-muted-foreground">
              Total: {rows.length} {loading ? "(memuat...)" : ""}
            </span>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button size="sm">Tambah Anggota</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Anggota</DialogTitle>
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
                    <Label>Nomor HP</Label>
                    <Input placeholder="08xxxx" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat</Label>
                    <Input placeholder="Alamat tempat tinggal" {...register("address")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      {...register("status", { required: true })}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
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
                <TableHead>Alamat</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.full_name || "-"}</TableCell>
                  <TableCell>{r.phone || "-"}</TableCell>
                  <TableCell>{r.address || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-2 py-1 text-xs ${
                        r.status === "aktif"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {r.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
