import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError, isLoading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/questions';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear auth error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear auth error when user modifies form
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData);
      // Navigation happens via useEffect when isAuthenticated becomes true
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="login-shell">
      <div className="login-orb login-orb--blue" />
      <div className="login-orb login-orb--amber" />

      <div className="login-card">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-sky-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M9 7l-4 5 4 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 7l4 5-4 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your DevQ&A account</p>
        </div>

        <div className="mt-8 grid gap-3">
          <Button type="button" variant="outline" className="w-full rounded-xl border-slate-200 bg-white/90 text-slate-700 hover:bg-white">
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full rounded-xl border-slate-200 bg-white/90 text-slate-700 hover:bg-white">
            Continue with GitHub
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {authError && (
          <Alert variant="destructive" data-testid="error-message">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 6h16v12H4z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="dkole@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-label="Email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                className="login-input pl-9"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a className="text-xs font-semibold text-sky-600 hover:underline" href="#">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M7 10V8a5 5 0 0110 0v2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="5" y="10" width="14" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                aria-label="Password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
                className="login-input pl-9"
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Keep me signed in
          </label>

          <Button
            type="submit"
            className="login-button w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
