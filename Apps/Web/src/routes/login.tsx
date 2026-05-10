import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — LokAwaaz Municipality Portal" },
      { name: "description", content: "Secure sign-in for municipal administrators." },
    ],
  }),
});

function LoginPage() {
  const { isAuthed, login, ready } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@lokawaaz.gov");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  if (ready && isAuthed) return <Navigate to="/" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("loginFailed"));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login(email);
      toast.success(t("welcomeBack"));
      navigate({ to: "/" });
    }, 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-[var(--gradient-brand)]">
        <div className="absolute -top-32 -right-20 size-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[480px] rounded-full bg-[color:var(--color-status-pending)]/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="size-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="font-bold text-lg">{t("appName")}</p>
            <p className="text-xs text-white/70">{t("portal")}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1
            className="text-4xl font-bold leading-tight text-white animate-fade-in"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {t("welcomeBack")}
          </h1>
          <p
            className="mt-3 text-white animate-fade-in"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
          >
            {t("loginSubtitle")}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            {[
              { n: "12.4k", l: t("totalReports") },
              { n: "98%", l: t("resolved") },
              { n: "240+", l: t("workers") },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl bg-[color:var(--brand-deep)]/50 p-4 ring-1 ring-white/30 hover-scale transition"
              >
                <p
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                >
                  {s.n}
                </p>
                <p
                  className="text-[11px] text-white mt-1"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p
          className="relative text-xs text-white/85"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        >
          {t("tagline")}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex justify-between items-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-lg bg-[var(--gradient-brand)] flex items-center justify-center">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <span className="font-bold">{t("appName")}</span>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
              <Languages className="size-3.5 ml-1.5 text-muted-foreground" />
              {(["en", "hi"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                    lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold">{t("login")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("loginSubtitle")}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lokawaaz.gov"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Demo credentials are pre-filled. Click sign in to continue.
          </p>
        </div>
      </div>
    </div>
  );
}
