import { BarChart3, Gauge, History, Plane, Radar, ShieldCheck, Wrench } from "lucide-react";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "live", label: "Live Feed", icon: Radar },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: History },
] as const;

export type AppView = (typeof navigation)[number]["id"];

export function LayoutShell({
  activeView,
  onViewChange,
  children,
}: {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-20 border-r border-white/10 bg-hangar-950/80 backdrop-blur-xl lg:block">
        <div className="grid h-20 place-items-center border-b border-white/10">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-aero-500 text-white shadow-glow">
            <Plane className="h-6 w-6" />
          </div>
        </div>
        <nav className="flex flex-col items-center gap-3 py-6">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`focus-ring group grid h-11 w-11 place-items-center rounded-lg border transition ${
                activeView === item.id
                  ? "border-aero-400/40 bg-aero-400/15 text-aero-200"
                  : "border-transparent text-slate-400 hover:border-aero-400/30 hover:bg-aero-400/10 hover:text-aero-200"
              }`}
              title={item.label}
              aria-label={item.label}
              aria-pressed={activeView === item.id}
            >
              <item.icon className="h-5 w-5" />
            </button>
          ))}
        </nav>
      </aside>

      <header className="no-print sticky top-0 z-20 border-b border-white/10 bg-hangar-950/80 backdrop-blur-xl lg:pl-20">
        <div className="flex min-h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-aero-500 text-white lg:hidden">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aero-300">AeroGuard</p>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">Aircraft Maintenance Control</h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex max-w-[44rem] overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    activeView === item.id ? "bg-aero-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              AI backend ready
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-aero-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 sm:px-6 lg:pl-28 lg:pr-8">{children}</main>
    </div>
  );
}
