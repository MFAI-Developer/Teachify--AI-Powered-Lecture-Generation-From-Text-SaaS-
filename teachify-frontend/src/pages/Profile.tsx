// src/pages/Profile.tsx
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  User as UserIcon,
  BadgeCheck,
  CalendarDays,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const Profile = () => {
  const { user, checkAuth, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      // Email is newly exposed from backend – fall back gracefully if older token
      setEmail((user as any).email ?? '');
      setCompany(user.company ?? '');
    }
  }, [user]);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const memberSince = formatDate(user.created_at);
  const avatarUrl = (user as any)?.avatar_url as string | undefined;

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSavingProfile(true);
    try {
      await authApi.updateProfile({ email, company });
      await checkAuth();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to update profile. Please try again.';
      setError(detail);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      await authApi.uploadAvatar(file);
      await checkAuth();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to upload profile image. Please try again.';
      setError(detail);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    setError(null);

    try {
      await authApi.deleteAvatar();
      await checkAuth();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to remove profile image. Please try again.';
      setError(detail);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setError('To delete your account, please type DELETE in the confirmation box.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await authApi.deleteAccount({
        password: deletePassword,
        confirm: deleteConfirm.trim(),
      });

      await logout();
      // Hard redirect to clear any state
      window.location.href = '/';
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to delete account. Please check your password and try again.';
      setError(detail);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8 animate-soft-fade">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
            <UserIcon className="h-3 w-3 text-primary" />
            <span>Account overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Manage your account information, profile photo, and account privacy for your Teachify
            workspace.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile info + editable fields */}
          <Card className="glass-panel p-7 md:p-8 animate-rise">
            {/* Top identity row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-border/70 overflow-hidden bg-primary/10 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${user.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-primary" />
                  )}
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
                  <span className="font-medium">Teachify account</span>
                </div>
                <p>Use the same profile for all your lectures and history.</p>
              </div>
            </div>

            {/* Editable fields */}
            <form onSubmit={handleProfileSubmit} className="space-y-6 text-sm md:text-base">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="text-lg font-medium mt-1">{user.username}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Username is used as a stable identifier in the system and cannot be changed.
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your organization or school"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  We only use your email for account-related communication and export notifications.
                </p>
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Avatar management */}
          <Card className="glass-panel p-7 md:p-8 animate-rise">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Profile photo</h2>
                <p className="text-sm text-muted-foreground">
                  Upload a profile image that will appear across your dashboard, history, and
                  lectures.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-border/70 overflow-hidden bg-primary/10 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${user.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Recommended: square PNG, JPG or WebP.</p>
                  <p>Maximum size ≈ 5 MB.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Upload photo'}</span>
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeletingAvatar}
                    onClick={handleDeleteAvatar}
                  >
                    {isDeletingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    <span>{isDeletingAvatar ? 'Removing...' : 'Remove photo'}</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="glass-panel border-destructive/40 bg-destructive/5 p-7 md:p-8 animate-rise">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger zone
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Deleting your account will permanently remove your profile, lecture history, uploads
              and active sessions. This action cannot be undone.
            </p>

            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Type DELETE to confirm</Label>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Current password</Label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Make sure you’ve exported any important lectures before deleting your account.
                </p>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeletingAccount}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingAccount ? 'Deleting account...' : 'Delete account'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
