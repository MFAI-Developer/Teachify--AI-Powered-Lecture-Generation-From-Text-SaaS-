import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, BadgeCheck, CalendarDays } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const memberSince = formatDate(user.created_at);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-2xl">
        {/* Header */}
        <div className="mb-8 animate-soft-fade">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
            <User className="h-3 w-3 text-primary" />
            <span>Account overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            View your account information and membership details for your Teachify workspace.
          </p>
        </div>

        {/* Profile card */}
        <Card className="glass-panel p-7 md:p-8 animate-rise">
          {/* Top identity row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Member since {memberSince}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 shadow-sm">
                <BadgeCheck className="h-3 w-3 text-emerald-500" />
                <span>Free plan</span>
              </div>
              <span>You can upgrade from the Billing page when available.</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6 text-sm md:text-base">
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p className="text-lg font-medium mt-1">{user.username}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Company</Label>
              <p className="text-lg font-medium mt-1">
                {user.company || 'Not specified'}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Account created</Label>
              <p className="text-lg font-medium mt-1">{memberSince}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
