"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sidebar-navigation';
import AppHeader from '@/components/app-header';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/signup'];

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      {children}
    </main>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full">
            <Sidebar collapsible="icon" variant="sidebar">
              <SidebarNavigation />
            </Sidebar>
            <SidebarInset className="flex flex-1 flex-col">
                <AppHeader />
                <main className="flex-1 overflow-y-auto bg-slate-50/50">
                    {children}
                </main>
            </SidebarInset>
        </div>
    );
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    if (!user && !isAuthRoute) {
      router.push('/login');
    }
    if (user && isAuthRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, isAuthRoute, router, pathname]);

  if (isUserLoading || (!user && !isAuthRoute) || (user && isAuthRoute)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
        {isAuthRoute ? (
             <AuthLayout>{children}</AuthLayout>
        ) : (
            <MainLayout>{children}</MainLayout>
        )}
    </SidebarProvider>
  );
}
