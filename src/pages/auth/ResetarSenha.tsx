"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranding } from "@/hooks/use-branding";

export default function ResetarSenha() {
  const { brandName } = useBranding();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string>(() => searchParams.get("email") ?? "");
  const [token, setToken] = useState<string>(() => searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get("email") ?? "");
    setToken(searchParams.get("token") ?? "");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !token) {
      setErrorMsg("Link inválido. Solicite um novo email.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("As senhas não conferem.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao redefinir senha");
      }
      setIsDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível redefinir a senha. Solicite um novo link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">{brandName}</span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {isDone ? "Senha redefinida!" : "Definir nova senha"}
            </CardTitle>
            <CardDescription>
              {isDone
                ? "Você será redirecionado para o login."
                : "Crie uma nova senha para acessar sua conta."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDone ? (
              <Button variant="ghost" className="w-full" onClick={() => router.push("/login")}>
                Ir para login
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="********"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Redefinir senha
                    </>
                  )}
                </Button>
                {errorMsg && <p className="text-sm text-destructive text-center">{errorMsg}</p>}

                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
