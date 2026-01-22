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
  loginWithPhonePassword,
  registerWithPhonePassword,
} from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuthPhone } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginWithPhonePassword(phone, password);
      await setAuthPhone(phone);
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
    setLoading(true);
    setError(null);

    try {
      await registerWithPhonePassword(phone, password, fullName);

      setIsRegister(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      setError(msg);
    } finally {
      setLoading(false);
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
        <div className="px-6 pt-2">
          <div className="flex gap-2 mb-4">
            <Button
              variant={isRegister ? "ghost" : "secondary"}
              className="w-1/2"
              onClick={() => setIsRegister(false)}
            >
              Masuk
            </Button>
            <Button
              variant={isRegister ? "secondary" : "ghost"}
              className="w-1/2"
              onClick={() => setIsRegister(true)}
            >
              Registrasi
            </Button>
          </div>
        </div>
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="+628123456789"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              {loading
                ? isRegister
                  ? "Registering..."
                  : "Signing in..."
                : isRegister
                  ? "Register"
                  : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
