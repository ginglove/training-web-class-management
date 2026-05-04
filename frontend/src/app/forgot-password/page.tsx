'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errorTranslations';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) {
      setError('Please fill in both email and new password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Intentional Vulnerability: This directly resets the password without an email token verification
      // A great test case for the software testing training!
      await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          new_password: newPassword 
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Đổi mật khẩu thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neu-flat p-10 max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto neu-flat flex items-center justify-center rounded-full text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Password Reset</h2>
          <p className="text-slate-500">Your password has been changed successfully.</p>
          <Button onClick={() => router.push('/')} className="w-full mt-4">
            Return to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="neu-flat p-10 max-w-md w-full text-center space-y-8"
      >
        <div className="w-20 h-20 mx-auto neu-flat flex items-center justify-center rounded-full text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="text-slate-500 mt-2">Enter your email and a new password</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-danger p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4 text-left">
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="account@example.com"
              required
            />

            <Input
              label="New Password *"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
          </div>

          <Button type="submit" className="w-full py-4 text-lg" isLoading={loading}>
            Reset Password
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-500">
          <p>
            Remembered your password?{' '}
            <Link href="/" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
