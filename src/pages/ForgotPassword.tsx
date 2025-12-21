import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Email tidak ditemukan');
      } else {
        setSent(true);
        toast.success(data.message || "Link reset password telah dikirim ke email Anda!");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mengirim email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">TA</span>
          </div>
          <CardTitle className="text-2xl font-bold">Lupa Password?</CardTitle>
          <CardDescription className="text-base mt-2">
            {sent 
              ? "Kami telah mengirimkan link reset password ke email Anda" 
              : "Masukkan email Anda untuk reset password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Masukkan email Anda"
                    className="h-12 text-base border-2 border-gray-300 focus:border-red-500 rounded-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-6 rounded-lg"
                  disabled={loading}
                >
                  {loading ? "Mengirim..." : "Kirim Link Reset"}
                </Button>
              </form>

              <div className="mt-6 flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Login
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 text-center py-6">
                <div className="text-5xl">📧</div>
                <p className="text-gray-700 font-semibold">Email Terkirim!</p>
                <p className="text-gray-600 text-sm">
                  Kami telah mengirimkan link reset password ke <span className="font-semibold text-red-600">{email}</span>
                </p>
                <p className="text-gray-600 text-sm mt-4">
                  Silakan cek email Anda dan ikuti instruksi untuk reset password. Link akan berlaku selama 24 jam.
                </p>
              </div>

              <Button 
                type="button"
                onClick={() => navigate("/auth")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-6 rounded-lg mt-6"
              >
                Kembali ke Login
              </Button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm"
                >
                  Coba email lain
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
