import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/minutes", label: "Minutes" },
  { to: "/missions", label: "Weekly Missions" },
];

export default function NavHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-lg font-bold text-white">
          S
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-800">Spectra</h1>
          <nav className="mt-1 flex gap-4">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  [
                    "text-sm font-medium",
                    isActive ? "text-[var(--accent)]" : "text-slate-400 hover:text-slate-600",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
