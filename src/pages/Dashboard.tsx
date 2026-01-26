import Home from "./Home";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PaymentModalForm } from "@/components/dashboard/PaymentModalForm";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-card text-card-foreground p-6 rounded-[2rem] shadow-sm border border-border flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Pembayaran Baru</DialogTitle>
              <DialogDescription>Isi formulir untuk mencatat transaksi pembayaran terbaru.</DialogDescription>
            </DialogHeader>
            <PaymentModalForm />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Tutup</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reusing the Home component for stats visualization */}
      <Home />
    </div>
  );
}
