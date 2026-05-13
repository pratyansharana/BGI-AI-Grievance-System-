import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Users, LogOut, Languages, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import logo from "@/assets/lokawaazlogo.png";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { t, lang, setLang } = useI18n();
  const { logout, email } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: t("dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/reports", label: t("reports"), icon: FileText },
    { to: "/workers", label: t("workers"), icon: Users },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-(--shadow-elev) overflow-hidden p-1">
            <img
              src={logo}
              alt="LokAwaaz Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-bold leading-tight">{t("appName")}</p>
            <p className="text-[11px] text-sidebar-foreground/60">{t("portal")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = isActive(it.to, it.exact);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-(--shadow-soft)"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <it.icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-1">
          <Languages className="size-4 ml-2 text-sidebar-foreground/70" />
          {(["en", "hi"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "flex-1 text-xs font-medium px-2 py-1.5 rounded-md transition",
                lang === l
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              )}
            >
              {l === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>

        <div className="px-2">
          <p className="text-xs text-sidebar-foreground/60">{t("welcome")}</p>
          <p className="text-sm font-medium truncate">{email ?? t("admin")}</p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="size-4" />
          {t("logout")}
        </Button>
      </div>
    </aside>
  );
}
