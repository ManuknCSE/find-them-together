import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Moon, Search, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { BrandWordmark } from "./brand-logo";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { NOTIFICATIONS } from "@/lib/mock-data";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/cases", label: "Cases" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/volunteer", label: "Volunteer" },
  { to: "/rewards", label: "Rewards" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/cases", search: { q } as any });
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-strong border-b">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link to="/" className="shrink-0"><BrandWordmark /></Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
                activeProps={{ className: "text-foreground bg-accent" }}>
                {n.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-sm ml-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search missing persons, cases, locations…"
                className="pl-9 bg-background/60" />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications <Badge variant="secondary">{NOTIFICATIONS.length}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NOTIFICATIONS.slice(0, 4).map((n) => (
                  <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{n.time}</div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="w-full text-center justify-center">View all</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account"><User className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{isAuthenticated ? (user?.fullName ?? "Account") : "Guest"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem asChild><Link to="/dashboard">Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/report">Report a case</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/" }); }} className="text-destructive focus:text-destructive">Sign out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild><Link to="/auth">Sign in</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/dashboard">Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/report">Report a case</Link></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isAuthenticated && (
              <Button asChild className="hidden sm:inline-flex ml-1 gradient-brand text-white hover:opacity-95">
                <Link to="/auth">Login / Register</Link>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open mobile menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="flex flex-row items-center justify-between">
                  <SheetTitle><BrandWordmark /></SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close mobile menu">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => (
                    <Link key={n.to} to={n.to} className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium">
                      {n.label}
                    </Link>
                  ))}
                  <Link to="/report" className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium">Report a case</Link>
                  <Link to="/notifications" className="px-3 py-2 rounded-md hover:bg-accent text-sm font-medium">Notifications</Link>
                  <Link to="/auth" className="mt-2 px-3 py-2 rounded-md gradient-brand text-white text-sm font-semibold text-center">Login / Register</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
