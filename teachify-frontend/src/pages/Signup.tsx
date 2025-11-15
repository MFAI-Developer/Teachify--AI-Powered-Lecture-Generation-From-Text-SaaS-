import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register(formData);
      toast.success('Account created successfully!');
      
      // Auto-login after signup
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md px-7 py-8 md:px-8 md:py-9 glass-panel animate-rise">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-3 mb-3 text-2xl font-semibold tracking-tight text-foreground"
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

          <p className="section-title mb-1">Create Account</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Join Teachify
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an account to start generating AI-powered lecture videos.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Choose a username"
              disabled={isLoading}
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          <div>
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Your organization"
              disabled={isLoading}
              maxLength={128}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {/* Bottom helper text */}
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-primary">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
