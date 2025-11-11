import { Card } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

const Billing = () => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods.
          </p>
        </div>

        <Card className="p-12 text-center">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Billing Management Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're working on bringing you a comprehensive billing management system. 
            For now, all users have access to the Free plan features.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
