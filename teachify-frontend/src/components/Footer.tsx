import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/70 bg-card/95">
      {/* Background graphics / subtle patterns */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      >
        <div className="bg-hero-spotlight absolute inset-0 mix-blend-soft-light" />
        <div className="bg-academic-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
            <Link
              to="/"
              className="flex items-center gap-3 text-2xl font-semibold text-foreground"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md shadow-sky-500/40">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span>Teachify</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  AI Lecture Studio
                </span>
              </div>
            </Link>

            <p className="max-w-md text-sm text-muted-foreground">
              AI-powered lecture video generation for educators and learners —
              turn any topic into a clear, engaging lecture in minutes.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Product
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/pricing"
                  className="transition-smooth hover:text-primary"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="transition-smooth hover:text-primary"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/privacy"
                  className="transition-smooth hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="transition-smooth hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Support
            </h3>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at
              <br />
              <a
                href="mailto:support@teachify.ai"
                className="text-primary transition-smooth hover:underline"
              >
                support@teachify.ai
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border/80 pt-6 text-center text-xs md:text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Teachify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
