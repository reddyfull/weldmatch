import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-shadow">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Weld<span className="text-accent">Match</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-white/80 hover:text-white transition-colors font-medium">
              Pricing
            </Link>
            <Link to="/about" className="text-white/80 hover:text-white transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-white/80 hover:text-white transition-colors font-medium">
              Contact
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user ? (
              <Button variant="hero" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/register/welder">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/pricing"
                className="text-white/80 hover:text-white transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-white/80 hover:text-white transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-white/80 hover:text-white transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                {!loading && user ? (
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" className="text-white hover:bg-white/10 w-full" asChild>
                      <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/register/welder" onClick={() => setIsOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
