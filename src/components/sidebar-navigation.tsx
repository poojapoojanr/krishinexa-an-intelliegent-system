'use client';
import { Leaf, Map, Sprout, BarChart3, Calendar, CloudCog, Home, TrendingUp, Landmark, User, Settings, PanelLeft, LogOut, TestTube, Microscope, HandCoins, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from './ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Satellite } from 'lucide-react';

export default function SidebarNavigation() {
  const pathname = usePathname();
  const { setOpenMobile, state: sidebarState, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const auth = useAuth();
  const router = useRouter();

  const navItems = [
    { href: '/', label: t('Dashboard', 'Dashboard'), icon: Home },
    { href: '/disease-detection', label: t('Disease Detection', 'Disease Detection'), icon: Microscope },
    { href: '/crop-recommendation', label: t('Crop Recommendation', 'Crop Recommendation'), icon: Sprout },
    { href: '/sensors', label: t('Soil Health', 'Soil Health'), icon: TestTube },
    { href: '/seasonal-planner', label: t('Seasonal Planner', 'Seasonal Planner'), icon: Calendar },
    { href: '/weather', label: t('Weather', 'Weather'), icon: CloudCog },
    { href: '/market-prices', label: t('Market Prices', 'Market Prices'), icon: TrendingUp },
    { href: '/loans-subsidies', label: t('Loans & Subsidies', 'Loans & Subsidies'), icon: HandCoins },
    { href: '/community', label: t('Community', 'Community'), icon: MessageSquare },
  ];

  const secondaryNavItems = [
    { href: '/settings', label: t('Settings', 'Settings'), icon: Settings },
    { href: '/profile', label: t('My Account', 'My Account'), icon: User },
  ];

  const handleLogout = () => {
    if (auth) {
      router.push('/login');
      signOut(auth).catch((error) => {
        console.error('Sign out error:', error);
      });
    }
  };
  
  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <div className="bg-primary p-2 rounded-lg flex items-center justify-center">
                  <Leaf className="text-primary-foreground h-6 w-6" />
              </div>
              <h1 className="text-lg font-bold font-headline text-foreground group-data-[collapsible=icon]:hidden">
                KrishiNexa
              </h1>
          </Link>
           <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpenMobile(false)}>
              <PanelLeft />
           </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label} onClick={() => setOpenMobile(false)}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{children: t(item.label, item.label), side: "right"}}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{t(item.label, item.label)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-2">
         <div className="hidden md:block mb-2">
            <SidebarTrigger onClick={() => sidebarState === 'expanded' && toggleSidebar()} />
         </div>
         <SidebarMenu>
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.label} onClick={() => setOpenMobile(false)}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{children: t(item.label, item.label), side: "right"}}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{t(item.label, item.label)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} tooltip={{children: t("Log Out", "Log Out"), side: "right"}}>
                <LogOut className="h-5 w-5"/>
                <span className="group-data-[collapsible=icon]:hidden">{t('Logout', 'Logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
