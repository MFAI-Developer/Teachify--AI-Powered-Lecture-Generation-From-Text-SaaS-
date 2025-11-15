import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Teachify and creating your first lectures.',
      features: [
        '5 lectures per month',
        'Basic AI generation',
        'Standard avatar',
        'HD video quality',
      ],
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For educators and creators who ship content regularly.',
      features: [
        'Unlimited lectures',
        'Advanced AI models',
        'Custom avatars',
        '4K video quality',
        'Priority support',
        'Document RAG generation',
      ],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16 max-w-3xl mx-auto animate-soft-fade">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Simple, transparent pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your workflow. Upgrade or downgrade any time — no hidden fees,
            no long-term contracts.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-rise">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`glass-panel relative p-7 md:p-8 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${
                plan.popular
                  ? 'border-primary/70 border-2 shadow-[0_18px_50px_rgba(56,189,248,0.25)]'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-5">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    Most Popular
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>

              <div className="mb-4">
                <span className="text-4xl md:text-5xl font-semibold">
                  {plan.price}
                </span>
                <span className="text-muted-foreground ml-2 text-sm md:text-base">
                  {plan.period}
                </span>
              </div>

              {plan.description && (
                <p className="text-sm text-muted-foreground mb-5">
                  {plan.description}
                </p>
              )}

              <ul className="space-y-3 mb-8 text-sm md:text-base">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() =>
                  navigate(isAuthenticated ? '/dashboard' : '/signup')
                }
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Card>
          ))}
        </div>

        {/* Small bottom note */}
        <p className="mt-8 text-center text-xs md:text-sm text-muted-foreground">
          You can change or cancel your plan at any time from your{' '}
          <span className="font-medium">Billing</span> page. Pricing is for illustration and can be
          adjusted in your production setup.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
