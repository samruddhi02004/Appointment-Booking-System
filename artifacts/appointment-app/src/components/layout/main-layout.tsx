import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Users, Settings, LogOut, LayoutDashboard, FileText, BarChart3, Clock, CalendarDays, Building2 } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout: contextLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        contextLogout();
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const navItems = {
    customer: [
      { name: "Home", href: "/", icon: LayoutDashboard },
      { name: "My Bookings", href: "/my-bookings", icon: Calendar },
    ],
    organiser: [
      { name: "Dashboard", href: "/organiser", icon: LayoutDashboard },
      { name: "My Business", href: "/organiser/business", icon: Building2 },
      { name: "Services", href: "/organiser/appointments", icon: Clock },
      { name: "Bookings", href: "/organiser/bookings", icon: FileText },
      { name: "Calendar", href: "/organiser/calendar", icon: CalendarDays },
      { name: "Reports", href: "/organiser/reports", icon: BarChart3 },
    ],
    admin: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Businesses", href: "/admin/businesses", icon: Building2 },
      { name: "Users", href: "/admin/users", icon: Users },
    ],
  };

  const currentNav = user ? navItems[user.role as keyof typeof navItems] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <Link href={user?.role === "customer" ? "/" : `/${user?.role}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm border-2 border-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">BookSlot</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {currentNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-3 h-auto py-3">
                <Avatar className="w-8 h-8 rounded-md bg-primary/10">
                  <AvatarFallback className="bg-transparent text-primary text-xs">{user ? getInitials(user.fullName) : ""}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">{user?.fullName}</span>
                  <span className="text-xs text-sidebar-foreground/60 truncate w-full capitalize">{user?.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navbar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <Link href={user?.role === "customer" ? "/" : `/${user?.role}`} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <div className="w-3 h-3 rounded-[2px] border-2 border-primary-foreground" />
            </div>
            <span className="text-lg font-bold">BookSlot</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{user ? getInitials(user.fullName) : ""}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currentNav.map((item) => (
                <DropdownMenuItem key={item.name} onClick={() => setLocation(item.href)} className="cursor-pointer">
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
