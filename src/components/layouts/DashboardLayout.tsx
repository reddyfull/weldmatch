import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Flame,
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Menu,
  Building,
  Users,
  PlusCircle,
  Search,
  Sparkles,
  Microscope,
  Mic,
  Rocket,
  Shield,
  MessageCircle,
  FileText as FileTextIcon,
  Mail,
  BarChart3,
  Send,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "welder" | "employer";
}

const welderNavItems: NavItem[] = [
  { label: "Dashboard", href: "/welder/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Profile", href: "/welder/profile/edit", icon: <User className="w-5 h-5" /> },
  { label: "Public Profile", href: "/welder/profile/settings", icon: <Globe className="w-5 h-5" /> },
  { label: "AI Chat", href: "/welder/chat", icon: <MessageCircle className="w-5 h-5" /> },
  { label: "Resume Builder", href: "/welder/resume-builder", icon: <FileTextIcon className="w-5 h-5" /> },
  { label: "Cover Letter", href: "/welder/cover-letter", icon: <Mail className="w-5 h-5" /> },
  { label: "Market Intel", href: "/welder/market-intelligence", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Career Coach", href: "/welder/career-coach", icon: <Sparkles className="w-5 h-5" /> },
  { label: "Weld Analyzer", href: "/welder/weld-analyzer", icon: <Microscope className="w-5 h-5" /> },
  { label: "Interview Coach", href: "/welder/interview-coach", icon: <Mic className="w-5 h-5" /> },
  { label: "Career Path", href: "/welder/career-path", icon: <Rocket className="w-5 h-5" /> },
  { label: "Job Search", href: "/welder/jobs", icon: <Search className="w-5 h-5" /> },
  { label: "Applications", href: "/welder/applications", icon: <FileText className="w-5 h-5" /> },
  { label: "Documents", href: "/welder/documents", icon: <Settings className="w-5 h-5" /> },
];

const employerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/employer/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Jobs", href: "/employer/jobs", icon: <Briefcase className="w-5 h-5" /> },
  { label: "Post New Job", href: "/employer/jobs/new", icon: <PlusCircle className="w-5 h-5" /> },
  { label: "Candidates", href: "/employer/candidates", icon: <Users className="w-5 h-5" /> },
  { label: "AI Chat", href: "/employer/chat", icon: <MessageCircle className="w-5 h-5" /> },
  { label: "Outreach", href: "/employer/outreach", icon: <Send className="w-5 h-5" /> },
  { label: "Market Intel", href: "/employer/market-intelligence", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Crew Optimizer", href: "/employer/crew-optimizer", icon: <Users className="w-5 h-5" /> },
  { label: "Safety Monitor", href: "/employer/safety-monitor", icon: <Shield className="w-5 h-5" /> },
  { label: "Company Settings", href: "/employer/settings", icon: <Building className="w-5 h-5" /> },
];

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = userType === "welder" ? welderNavItems : employerNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-shadow">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Weld<span className="text-accent">Match</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.href
                ? "bg-accent text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userType}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-card border-r border-border">
        <NavContent />
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 bg-card border-b border-border h-16 items-center justify-end px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              Weld<span className="text-accent">Match</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{displayName}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-16 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
