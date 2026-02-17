'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  rememberMe: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

type LoginReason = 'auth_required' | 'session_expired' | 'auth_error';

const reasonMessages: Record<LoginReason, string> = {
  auth_required: 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.',
  session_expired: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
  auth_error: 'Bir hata oluştu. Lütfen tekrar giriş yapın.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Get redirect path and reason from URL
  const redirect = searchParams.get('redirect');
  const reasonParam = searchParams.get('reason') as LoginReason;

  useEffect(() => {
    if (auth.envError) {
      toast.error(auth.envError);
      return;
    }

    // Set reason message
    if (reasonParam && reasonParam in reasonMessages) {
      toast.error(reasonMessages[reasonParam]);
    }

    // Redirect if already authenticated
    if (auth.status === 'authenticated' && auth.session) {
      router.replace(redirect || '/home');
    }
  }, [auth.envError, auth.session, auth.status, router, redirect, reasonParam]);

  const handleSubmit = useCallback(
    async (values: LoginForm) => {
      setIsSubmitting(true);
      try {
        const res = await auth.signInWithPassword(values.email, values.password);
        if (!res.ok) {
          toast.error(res.message);
          return;
        }

        toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');

        // Handle remember me
        if (values.rememberMe) {
          // Store remember me preference
          try {
            localStorage.setItem('rememberMe', 'true');
          } catch {
            // Ignore localStorage errors
          }
        }

        // Small delay for better UX
        setTimeout(() => {
          router.replace(redirect || '/home');
        }, 500);
      } finally {
        setIsSubmitting(false);
      }
    },
    [auth, router, redirect]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden login-gradient-bg">
      {/* Grid pattern decoration */}
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

      {/* Animated glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none animate-pulse-slow login-glow-primary" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none animate-pulse-slower login-glow-accent" />

      <div className="w-full max-w-md space-y-6 relative z-10 page-enter stagger-children">
        {/* Logo/Brand */}
        <div className="text-center space-y-3 slide-up-fade">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-primary shadow-lg shadow-primary/20 glow-primary mx-auto">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">ProsektorWeb Dashboard</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Hesabınıza giriş yapın
          </p>
        </div>

        <Card className="border-border/50 shadow-lg glass-strong">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Giriş Yap</CardTitle>
            <CardDescription className="text-balance">
              Email adresiniz ve şifrenizle giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              method="post"
              action="/login"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@firma.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={form.formState.errors.email ? 'border-destructive focus:ring-destructive/20' : 'focus:ring-primary/20 focus:border-primary'}
                  {...form.register('email')}
                  data-slot="login-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className={
                      form.formState.errors.password ? 'border-destructive focus:ring-destructive/20 pr-10' : 'focus:ring-primary/20 focus:border-primary pr-10'
                    }
                    {...form.register('password')}
                    data-slot="login-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('rememberMe')}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Beni hatırla (30 gün)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gradient-primary border-0 text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                disabled={isSubmitting}
                data-slot="login-submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                İlk kurulum için bir <span className="font-medium text-foreground">Owner</span>{' '}
                kullanıcısı ve tenant üyeliği gerekir. Eğer giriş yapabiliyor ama
                dashboard açılmıyorsa, tenant üyeliğiniz yoktur.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ProsektorWeb. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}

export default LoginPageWrapper;
