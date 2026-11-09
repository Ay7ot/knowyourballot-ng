"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { gutter } from "@/lib/gutter";
import FindBallot from "@/components/FindBallot";

const NAV = [
  { href: "/", label: "Find my ballot", note: "Search by polling unit, LGA, ward or name" },
  { href: "/who-decides", label: "Who decides", note: "Fuel, naira, roads, schools: which office controls what" },
  { href: "/economy", label: "Economy", note: "Prices, the naira, jobs and debt, in plain words" },
  { href: "/guide", label: "Voting day", note: "What to bring and how voting works" },
  { href: "/state", label: "States", note: "Browse all 36 states and the FCT" },
  { href: "/data", label: "Sources", note: "Where the data comes from, and corrections" },
] as const;

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="Know Your Ballot, home">
      {/* Ballot box with a folded ballot going in */}
      <svg viewBox="0 0 32 32" className="h-8 w-8 text-green" aria-hidden>
        <rect x="3" y="13" width="26" height="16" rx="2" fill="currentColor" />
        <rect x="9" y="12" width="14" height="2.5" rx="1" fill="var(--paper)" />
        <path d="M11 3h10v10H11z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="1.6" />
        <path
          d="M13.5 8.2l1.8 1.8 3.4-3.6"
          fill="none"
          stroke="var(--violet)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="display whitespace-nowrap text-[1.05rem] leading-none tracking-tight">
        Know Your <span className="text-green">Ballot</span>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDialogElement>(null);
  const lastPath = useRef(path);

  // Close the menu and search when the route changes.
  useEffect(() => {
    if (lastPath.current !== path) {
      lastPath.current = path;
      setOpen(false);
      setSearchOpen(false);
      searchRef.current?.close();
    }
  }, [path]);

  // Cmd/Ctrl+K opens the global search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const dialog = searchRef.current;
    if (!dialog) return;
    if (searchOpen && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => dialog.querySelector<HTMLInputElement>('input[type="search"]')?.focus());
    }
    if (!searchOpen && dialog.open) dialog.close();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen]);

  // Escape closes; lock page scroll while the sheet is open on a phone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className="no-print sticky top-0 z-40 border-b border-rule bg-paper"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="shell flex h-14 items-center justify-between gap-4 md:h-16" style={gutter}>
        <Wordmark />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
            className="hidden min-h-10 items-center gap-2 rounded-full border border-rule bg-sheet px-3 text-sm text-muted transition-colors hover:border-green hover:text-ink lg:inline-flex"
            aria-label="Search your ballot (Command K or Control K)"
          >
            <SearchIcon />
            <span>Search</span>
            <kbd
              className="mono rounded border border-rule px-1 text-[0.65rem] text-muted"
              title="Command K on macOS, Ctrl K on Windows and Linux"
            >
              ⌘K
            </kbd>
          </button>

          {/* Tablet and desktop: inline links */}
          <nav aria-label="Main" className="hidden items-center gap-0.5 text-[0.95rem] md:flex">
            {NAV.slice(1).map(({ href, label }) => {
              const active = isActive(path, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-md px-3 py-2 font-medium transition-colors hover:bg-green-soft hover:text-ink ${active ? "text-ink after:absolute after:inset-x-3 after:-bottom-[0.6rem] after:h-[3px] after:rounded-full after:bg-green" : "text-muted"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink hover:bg-green-soft lg:hidden"
            aria-label="Search your ballot"
          >
            <SearchIcon />
          </button>

          {/* Phone: one menu button */}
          <button
            ref={btnRef}
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium text-ink hover:bg-green-soft sm:px-3 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="hidden sm:inline">{open ? "Close" : "Menu"}</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Phone menu sheet */}
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-rule bg-paper md:hidden"
        style={{ top: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <nav aria-label="Main" style={gutter} className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          <ul className="divide-y divide-rule">
            {NAV.map(({ href, label, note }) => {
              const active = isActive(path, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-4"
                  >
                    <span
                      aria-hidden
                      className={`h-8 w-1 shrink-0 rounded-full ${active ? "bg-green" : "bg-transparent"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="display-tight block text-xl">{label}</span>
                      <span className="block text-sm text-muted">{note}</span>
                    </span>
                    <span aria-hidden className="text-xl text-muted">
                      ›
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <dialog
        ref={searchRef}
        aria-labelledby="search-title"
        onClose={() => setSearchOpen(false)}
        className="m-auto w-[min(760px,calc(100vw-24px))] overflow-visible rounded-xl border border-rule bg-sheet p-0 text-ink shadow-2xl backdrop:bg-black/45"
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <p id="search-title" className="display-tight text-lg">
            Find your ballot
          </p>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="h-10 rounded-md px-3 text-sm font-medium hover:bg-green-soft"
          >
            Close
          </button>
        </div>
        <div className="search-body max-h-[75dvh] overflow-y-auto p-4">
          <FindBallot autoFocus quick={[]} />
          <p className="mt-3 text-xs text-muted">
            Search by polling unit code, LGA, ward, candidate or party. Press Esc to close.
          </p>
        </div>
      </dialog>
    </header>
  );
}
