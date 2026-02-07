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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Leaf, Loader2, Phone, Mail } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const passwordPolicy = z.string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[a-z]/, 'Must include at least one lowercase letter')
  .regex(/[0-9]/, 'Must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must include at least one special character');

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid Indian mobile number'),
  district: z.string().min(1, 'District is required'),
  password: passwordPolicy,
  allowAlerts: z.boolean(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage } = useTranslation();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      district: '',
      password: '',
      allowAlerts: true,
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) router.push('/');
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const userCredential = await initiateEmailSignUp(auth, data.email, data.password);
      
      // Save user profile to Firestore immediately after signup
      if (userCredential?.user?.uid) {
        await setDoc(
          doc(db, 'users', userCredential.user.uid),
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            district: data.district,
            allowAlerts: data.allowAlerts,
            language: 'en',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      toast({
        title: 'Account created 🌾',
        description: 'Welcome to KrishiNexa! Your profile has been set up.',
      });
      router.push('/');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create account';
      toast({
        title: 'Signup error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
      
      {/* LEFT – Farmer Visual */}
      <div className="hidden md:flex flex-col justify-center px-16 bg-[url('/fields-bg.jpg')] bg-cover bg-center relative">
  <div className="absolute inset-0 bg-green-900/40" />
  
  <div className="relative text-white max-w-md">
    <img
      src="/farmer-hands-grain.jpg"
      alt="Indian farmer sowing seeds"
      className="rounded-2xl shadow-2xl mb-6"
    />

    <h2 className="text-3xl font-bold mb-3">
      Built for Indian Farmers 🌾
    </h2>

    <p className="text-lg text-green-100">
      Get real-time weather alerts, soil health insights,
      NDVI stress warnings and crop recommendations —
      directly to your phone.
    </p>
  </div>
</div>


      {/* RIGHT – Signup Form */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-600 p-3 rounded-full w-fit">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800 mt-2">
              Join KrishiNexa
            </CardTitle>
            <CardDescription>
              Weather alerts • Crop advice • Market insights
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="firstName" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="lastName" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="farmer@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number (India)</FormLabel>
                    <FormControl>
                      <Input placeholder="9XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="district" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bengaluru, Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="password" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="allowAlerts" control={form.control} render={({ field }) => (
                  <FormItem className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label className="text-sm">
                      I agree to receive weather, crop and government alerts
                    </Label>
                  </FormItem>
                )} />

                <Button className="w-full bg-green-700 hover:bg-green-800">
                  Create Farmer Account
                </Button>
              </form>
            </Form>

            <p className="text-sm text-center mt-4">
              Already registered?{' '}
              <Link href="/login" className="text-green-700 underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
