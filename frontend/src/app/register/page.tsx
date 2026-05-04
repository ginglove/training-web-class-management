'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errorTranslations';

export default function Register() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState('');

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    
    if (!email) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email';
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validate()) return;

    setLoading(true);

    try {
      const data = await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          full_name: fullName, 
          email, 
          password, 
          department 
        }),
      });

      login(data.user, data.access_token);
      router.push('/home');
    } catch (err: any) {
      setGeneralError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-slate-500 mt-2">Join the training management system</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6" noValidate>
          {generalError && (
            <div className="bg-red-100 text-danger p-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
              {generalError}
            </div>
          )}

          <div className="space-y-4 text-left">
            <Input
              label="Full Name *"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              error={fieldErrors.fullName}
            />

            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              error={fieldErrors.email}
            />

            <Input
              label="Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              error={fieldErrors.password}
            />

            <Input
              label="Department (Optional)"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. QA, Engineering"
            />
          </div>

          <Button type="submit" className="w-full py-4 text-lg" isLoading={loading}>
            Register
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-500">
          <p>
            Already have an account?{' '}
            <Link href="/" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
