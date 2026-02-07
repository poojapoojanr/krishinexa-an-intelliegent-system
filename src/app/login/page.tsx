'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Leaf, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { signInWithCustomToken } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [emailNotRegistered, setEmailNotRegistered] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!isUserLoading && user) router.push('/');
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await initiateEmailSignIn(auth, data.email, data.password);
      toast({
        title: 'Signed in 🌱',
        description: 'Welcome back to your fields and crops.',
      });
      router.push('/');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to sign in';
      toast({
        title: 'Sign-in error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSendEmailOtp = async () => {
    if (!otpEmail.trim()) {
      toast({ title: 'Email required', description: 'Enter a valid email to get the code', variant: 'destructive' });
      return;
    }
    try {
      setVerifyError(null);
      setEmailNotRegistered(null);
      setSendingOtp(true);
      const normalizedEmail = otpEmail.trim().toLowerCase();
      const res = await fetch('/api/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error && typeof data.error === 'string' && data.error.toLowerCase().includes('email not registered')) {
          setEmailNotRegistered(data.error);
          toast({ title: 'Email not registered', description: 'Please sign up first', variant: 'destructive' });
          return;
        }
        throw new Error(data?.error || 'Failed to send OTP');
      }
      // If server returned a test code (development mode), auto-fill it and surface it in UI
      if (data?.testCode) {
        setTestOtp(String(data.testCode));
        setOtpCode(String(data.testCode));
      } else {
        setTestOtp(null);
      }
      setOtpSent(true);
      toast({ title: 'OTP sent', description: data?.message || 'Check your email for the code' });
    } catch (err: any) {
      console.error('Email OTP send failed', err);
      toast({ title: 'OTP failed', description: err?.message || 'Could not send OTP', variant: 'destructive' });
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  const handleVerifyEmailOtp = async () => {
    if (!otpEmail.trim()) {
      toast({ title: 'Email required', description: 'Enter the same email you requested OTP on', variant: 'destructive' });
      return;
    }
    if (!otpCode.trim()) {
      toast({ title: 'Enter OTP', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }
    try {
      setVerifyError(null);
      setVerifyingOtp(true);
      const normalizedEmail = otpEmail.trim().toLowerCase();
      const res = await fetch('/api/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send both `code` and `otp` to be compatible with backends expecting either key
        body: JSON.stringify({ email: normalizedEmail, code: otpCode.trim(), otp: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error || 'Invalid OTP';
        // Handle common OTP errors gracefully and show inline message
        const lower = String(errMsg).toLowerCase();
        if (lower.includes('otp not found') || lower.includes('otp expired') || lower.includes('invalid otp') || lower.includes('too many')) {
          setVerifyError(errMsg);
          toast({ title: 'OTP error', description: errMsg, variant: 'destructive' });
          return;
        }
        throw new Error(errMsg);
      }
      // Sign in with custom token (links to actual user account)
      if (data?.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else {
        throw new Error('Server did not return an authentication token. Please try again.');
      }
      toast({ title: 'OTP verified', description: data?.message || 'Logged in with email OTP' });
      router.push('/');
    } catch (err: any) {
      console.error('Email OTP verify failed', err);
      setVerifyError(err?.message || 'Invalid OTP');
      toast({ title: 'Invalid OTP', description: err?.message || 'Please retry', variant: 'destructive' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-green-50 via-lime-50 to-emerald-100 relative">
      {/* LANGUAGE SWITCHER */}
      <div className="absolute top-4 right-4 z-20">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[100px] border-green-300 bg-white/80">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="kn">Kannada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LEFT: FARMER VISUAL */}
      <div className="hidden md:flex flex-col items-center justify-center p-10 text-center">
        <img
          src="/farmer-cartoon.png"
          alt="Indian farmer illustration"
          className="w-80 mb-6 animate-[float_6s_ease-in-out_infinite]"
        />
        <h2 className="text-2xl font-bold text-green-800">
          {t('Welcome Back, Farmer 🌾', 'Welcome Back, Farmer 🌾')}
        </h2>
        <p className="text-green-700 mt-2 max-w-sm">
          {t('Get real-time weather alerts, crop recommendations, soil health insights and market prices.', 'Get real-time weather alerts, crop recommendations, soil health insights and market prices.')}
        </p>
      </div>

      {/* RIGHT: LOGIN CARD */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-green-200 shadow-xl bg-white/95">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-600 p-3 rounded-full w-fit">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800 mt-2">
              {t('Login to KrishiNexa', 'Login to KrishiNexa')}
            </CardTitle>
            <CardDescription>
              {t('All farm info in one place', 'खेती से जुड़ी हर जानकारी, एक जगह')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* EMAIL */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Email', 'Email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder={t('farmer@email.com', 'farmer@email.com')}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PASSWORD */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t('Password', 'Password')}</FormLabel>
                        <Link
                          href="#"
                          className="text-sm text-green-700 underline"
                        >
                          {t('Forgot password?', 'Forgot password?')}
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('Login to Dashboard', 'Login to Dashboard')}
                </Button>
              </form>
            </Form>

            <div className="my-6 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-700" />
                  <p className="font-semibold text-green-800">{t('Login with Email OTP', 'Login with Email OTP')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    placeholder={t('Enter email address', 'Enter email address')}
                    value={otpEmail}
                    onChange={(e) => { setOtpEmail(e.target.value); setEmailNotRegistered(null); }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendEmailOtp}
                    disabled={sendingOtp}
                    className="sm:w-auto w-full"
                  >
                    {sendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('Send OTP', 'Send OTP')}
                  </Button>
                </div>

                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    placeholder={t('Enter 6-digit OTP', 'Enter 6-digit OTP')}
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value); setVerifyError(null); }}
                    disabled={!otpSent}
                    ref={otpInputRef}
                    className={verifyError ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    className="bg-green-700 hover:bg-green-800 sm:w-auto w-full"
                    onClick={handleVerifyEmailOtp}
                    disabled={!otpSent || verifyingOtp}
                  >
                    {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('Verify & Login', 'Verify & Login')}
                  </Button>
                </div>

                {verifyError && (
                  <div className="mt-2 text-sm text-red-600">
                    <div>{verifyError}</div>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendEmailOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? 'Sending...' : 'Resend OTP'}
                      </Button>
                    </div>
                  </div>
                )}

                {testOtp && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <strong className="text-green-800">Test OTP:</strong>{' '}
                    <span className="font-medium">{testOtp}</span>{' '}
                    <span className="text-xs">(development only)</span>
                  </div>
                )}

                {emailNotRegistered && (
                  <div className="mt-2 text-sm text-red-700">
                    {emailNotRegistered}{' '}
                    <Link href="/signup" className="underline text-green-700">Sign up</Link>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {t('No SMS needed. We email a one-time code to your inbox.', 'No SMS needed. We email a one-time code to your inbox.')}
                </p>
              </div>
            </div>

            <p className="text-sm text-center mt-4">
              {t('New farmer?', 'New farmer?')}{' '}
              <Link href="/signup" className="text-green-700 underline">
                {t('Create an account', 'Create an account')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FLOAT ANIMATION */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
