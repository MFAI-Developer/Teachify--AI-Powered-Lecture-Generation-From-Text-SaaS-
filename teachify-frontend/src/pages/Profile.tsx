import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            View your account information.
          </p>
        </div>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">
                Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="space-y-6">
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
              <Label className="text-muted-foreground">Account Created</Label>
              <p className="text-lg font-medium mt-1">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
