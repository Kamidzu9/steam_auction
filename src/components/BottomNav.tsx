"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = { className?: string };

function IconGrid({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconStack({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 8l8-4 8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M3 19c0-3 2.6-5.4 5.8-5.4S14.6 16 14.6 19" />
      <path d="M14.4 19c0-2.3 1.9-4.1 4.2-4.1" />
    </svg>
  );
}

function IconUser({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="7.5" r="3.4" />
      <path d="M4.5 19c1.8-3.3 5-5 7.5-5s5.7 1.7 7.5 5" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconGrid },
  { href: "/pools", label: "Pools", icon: IconStack },
  { href: "/friends", label: "Freunde", icon: IconUsers },
  { href: "/profile", label: "Profil", icon: IconUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/70 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-5 py-2 text-xs transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
