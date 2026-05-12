import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/lokawaazlogo.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  ShieldCheck,
  Languages,
  Loader2,
  FileText,
  CheckCircle2,
  Users,
  LockKeyhole,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — LokAwaaz Municipality Portal" },
      {
        name: "description",
        content: "Secure sign-in for municipal administrators.",
      },
    ],
  }),
});

function LoginPage() {
  const { isAuthed, loginWithGoogle, ready } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (ready && isAuthed) return <Navigate to="/" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success(t("welcomeBack"));
      navigate({ to: "/" });
    } catch (error) {
      console.error(error);
      toast.error(t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white relative">
      {/* Tricolor blended background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,153,51,0.42)_0%,rgba(255,255,255,0.96)_42%,rgba(255,255,255,0.98)_55%,rgba(19,136,8,0.35)_100%)]" />

      <div className="absolute -top-32 -right-20 h-80 w-[620px] rounded-full bg-orange-300/35 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 h-96 w-[680px] rounded-full bg-green-500/25 blur-3xl" />
      <div className="absolute top-28 right-24 h-72 w-72 rounded-full border-[24px] border-blue-900/5" />

      {/* Ashoka chakra watermark */}
      <div className="absolute right-24 top-40 hidden xl:flex size-72 items-center justify-center rounded-full border-[18px] border-blue-900/5">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-[130px] w-[2px] bg-blue-900/5 origin-bottom"
            style={{ transform: `rotate(${i * 15}deg) translateY(-65px)` }}
          />
        ))}
      </div>

      <main className="relative z-10 min-h-screen px-8 py-8 lg:px-16">
        {/* Top brand + language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="LokAwaaz Logo"
                className="h-12 w-12 object-contain"
              />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                LokAwaaz
              </h1>
              <p className="text-base font-medium text-slate-600">
                Municipality Portal
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-slate-200">
            <Languages className="size-4 ml-2 text-slate-500" />
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  lang === l
                    ? "bg-green-700 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {l === "en" ? "EN" : "हिं"}
              </button>
            ))}
          </div>
        </div>

        {/* Laptop layout */}
        <section className="grid min-h-[calc(100vh-120px)] grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left content */}
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.32em] text-green-800">
              Admin Dashboard
            </p>

            <h2 className="text-6xl font-black tracking-tight text-slate-950 drop-shadow-sm xl:text-7xl">
              Welcome back
            </h2>

            <p className="mt-5 max-w-2xl text-xl font-medium text-slate-600">
              Sign in to manage civic reports across your municipality
            </p>

            <div className="mt-12 grid grid-cols-3 gap-5">
              <StatCard
                icon={<FileText className="size-7 text-blue-700" />}
                value="12.4k"
                label={t("totalReports")}
              />
              <StatCard
                icon={<CheckCircle2 className="size-7 text-green-700" />}
                value="98%"
                label={t("resolved")}
              />
              <StatCard
                icon={<Users className="size-7 text-purple-700" />}
                value="240+"
                label={t("workers")}
              />
            </div>
          </div>

          {/* Right login card */}
          <div className="flex justify-center lg:justify-end">
            <form
              onSubmit={submit}
              className="w-full max-w-md rounded-[2rem] bg-white/85 p-8 shadow-2xl ring-1 ring-slate-200 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={logo}
                    alt="LokAwaaz Logo"
                    className="h-10 w-10 object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-950">
                    Admin Sign In
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    Secure access to your dashboard
                  </p>
                </div>
              </div>

              <div className="my-7 h-px bg-slate-200" />

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-white text-base font-bold text-slate-800 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <span className="mr-2 text-xl font-black text-blue-600">G</span>
                )}

                {loading ? t("signingIn") : "Sign in with Google"}
              </Button>

              <p className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck className="size-4" />
                Secure • Private • Only authorized personnel
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl bg-white/80 p-5 shadow-lg ring-1 ring-slate-200 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100">
        {icon}
      </div>

      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}