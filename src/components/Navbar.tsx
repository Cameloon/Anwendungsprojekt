import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  FileText,
  GraduationCap,
  LogIn,
  ShieldCheck,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/demoMode";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import AccountMenu from "@/components/AccountMenu";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";

const Navbar = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const accessQuery = useQuery(api.profiles.getAccessStatus, IS_DEMO ? "skip" : {});
  const access = IS_DEMO ? "active" : accessQuery;
  const isActive = access === "active";

  const navItems = isActive
    ? [
        ...(isAdmin
          ? [{ label: language.match({ english: () => "Admin Dashboard", german: () => "Admin-Dashboard" }), path: "/admin-dashboard", icon: ShieldCheck }]
          : []),
        { label: language.match({ english: () => "Dashboard", german: () => "Dashboard" }), path: "/dashboard", icon: LayoutDashboard },
        { label: "Planner", path: "/planner", icon: CalendarDays },
        { label: "Forum", path: "/forum", icon: MessageSquare },
        { label: language.match({ english: () => "Scripts", german: () => "Skripte" }), path: "/skripte", icon: FileText },
      ]
    : user
      ? [{ label: language.match({ english: () => "Request Access", german: () => "Zugang freischalten" }), path: "/dashboard", icon: FileEdit }]
      : [];

  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="font-heading font-bold text-lg text-foreground">
              StudentPlanner
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && <NotificationsBell />}
            {user ? (
              <AccountMenu />
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{language.match({ english: () => "Login", german: () => "Login" })}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav strip */}
        <div className="flex md:hidden items-center justify-center gap-1 pb-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Navbar;
