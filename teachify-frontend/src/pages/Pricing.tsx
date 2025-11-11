import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
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
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
