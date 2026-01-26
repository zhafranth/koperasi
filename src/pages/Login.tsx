import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import {
  loginWithEmailPassword,
  registerWithEmailProfile,
} from "@/services/auth";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regInfo, setRegInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginWithEmailPassword(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to login";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    setRegInfo(null);
    try {
      const res = await registerWithEmailProfile(
        email,
        password,
        fullName,
        phone || undefined,
      );
      const isPendingConfirmation =
        typeof res === "object" &&
        res !== null &&
        "needsConfirmation" in (res as Record<string, unknown>);
      if (isPendingConfirmation) {
        setRegInfo("Registrasi berhasil. Silakan cek email untuk konfirmasi.");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Koperasi Login
          </CardTitle>
          <CardDescription className="text-center">
            Khusus untuk Pengurus Koperasi
          </CardDescription>
        </CardHeader>
        <div className="px-6">
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 -mb-px border-b-2 ${activeTab === "login" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              onClick={() => setActiveTab("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`px-4 py-2 -mb-px border-b-2 ${activeTab === "register" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              onClick={() => setActiveTab("register")}
              type="button"
            >
              Register
            </button>
          </div>
        </div>
        {activeTab === "login" ? (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {(regError || regInfo) && (
                <div
                  className={`text-sm p-3 rounded-md flex items-center gap-2 ${regError ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}
                >
                  <AlertCircle className="h-4 w-4" />
                  {regError || regInfo}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Nama Lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg_email">Email</Label>
                <Input
                  id="reg_email"
                  type="email"
                  placeholder="nama@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg_password">Password</Label>
                <Input
                  id="reg_password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon (opsional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={regLoading}>
                {regLoading ? "Registering..." : "Register"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
