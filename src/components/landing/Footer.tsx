import { Link } from "react-router-dom";
import { Flame, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  forWelders: [
    { label: "Find Jobs", href: "/welder/jobs" },
    { label: "Create Profile", href: "/register/welder" },
    { label: "Certification Verification", href: "/verify" },
    { label: "Career Resources", href: "/resources" },
  ],
  forEmployers: [
    { label: "Post Jobs", href: "/register/employer" },
    { label: "Search Candidates", href: "/employer/candidates" },
    { label: "Pricing", href: "/pricing" },
    { label: "Enterprise", href: "/enterprise" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-white/80">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Weld<span className="text-accent">Match</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 mb-6">
              The premier job board for certified welders and the employers who need them.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:hello@weldmatch.com" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="w-4 h-4" />
                hello@weldmatch.com
              </a>
              <a href="tel:+18005551234" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="w-4 h-4" />
                1-800-555-1234
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Houston, TX
              </div>
            </div>
          </div>

          {/* For Welders */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Welders</h4>
            <ul className="space-y-2">
              {footerLinks.forWelders.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Employers</h4>
            <ul className="space-y-2">
              {footerLinks.forEmployers.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} WeldMatch. All rights reserved.
          </p>
          <p className="text-sm text-white/50">
            Built with respect for the craft. 🔥
          </p>
        </div>
      </div>
    </footer>
  );
}
