import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground mb-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>Teachify</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered lecture video generation for educators and learners.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-primary transition-smooth">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-smooth">About</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-smooth">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-smooth">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Support</h3>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at<br />
              <a href="mailto:support@teachify.ai" className="text-primary hover:underline">
                support@teachify.ai
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Teachify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
