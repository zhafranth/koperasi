import Home from "./Home";
import { PaymentForm } from "@/components/dashboard/PaymentForm";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-card text-card-foreground p-6 rounded-[2rem] shadow-sm border border-border">
        <h2 className="text-xl font-bold mb-4">Admin Actions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <PaymentForm />
          <div className="bg-popover text-popover-foreground p-6 rounded-2xl border border-border flex items-center justify-center">
            More admin features (Member Management, Loan Approval) coming
            soon...
          </div>
        </div>
      </div>

      {/* Reusing the Home component for stats visualization */}
      <Home />
    </div>
  );
}
