import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-2xl">
        {/* Header */}
        <div className="mb-8 animate-soft-fade">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
            <CreditCard className="h-3 w-3 text-primary" />
            <span>Subscription &amp; payments</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Billing
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Manage your subscription, plan, and payment details from this page.
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-6 animate-rise">
          {/* Current plan summary */}
          <Card className="glass-panel p-7 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="section-title mb-1">Current plan</p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Free
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;re currently using the Free tier of Teachify.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 shadow-sm">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Early access</span>
                </div>
                <span>Upgrade options coming soon</span>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Limited monthly lecture generation</li>
              <li>• Access to core AI features</li>
              <li>• Standard avatar video output</li>
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                View pricing plans
              </Button>
              <p className="text-[11px] text-muted-foreground">
                You&apos;ll be able to manage payment methods once billing is enabled.
              </p>
            </div>
          </Card>

          {/* Placeholder state for full billing UI */}
          <Card className="glass-panel p-8 md:p-10 text-center">
            <ShieldCheck className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Billing Management Coming Soon
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-4">
              We&apos;re working on a full billing experience where you&apos;ll be able
              to upgrade plans, manage invoices, and update payment methods directly
              from this page.
            </p>
            <p className="text-xs text-muted-foreground">
              For now, you can explore future plans on the{' '}
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="underline text-primary hover:text-primary/80"
              >
                Pricing
              </button>{' '}
              page.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;
