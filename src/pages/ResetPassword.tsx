import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is in recovery mode
    const checkRecoveryMode = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        toast.error("Link reset password tidak valid atau sudah expired");
        navigate("/auth");
      }
    };

    checkRecoveryMode();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success("Password berhasil direset!");
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">✓</span>
            </div>
            <CardTitle className="text-2xl font-bold">Berhasil!</CardTitle>
            <CardDescription className="text-base mt-2">
              Password Anda telah berhasil direset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center py-6">
              <p className="text-gray-700 text-sm">
                Silakan login dengan password baru Anda di halaman login.
              </p>
              <p className="text-gray-600 text-xs">
                Anda akan diarahkan ke halaman login dalam beberapa detik...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">TA</span>
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-base mt-2">
            Masukkan password baru Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">Password Baru</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="h-12 text-base border-2 border-gray-300 focus:border-red-500 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-semibold">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="h-12 text-base border-2 border-gray-300 focus:border-red-500 rounded-lg"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-6 rounded-lg"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
            >
              Kembali ke Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
