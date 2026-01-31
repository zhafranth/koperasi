import Home from "./Home";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Reusing the Home component for stats visualization */}
      <Home />
    </div>
  );
}
