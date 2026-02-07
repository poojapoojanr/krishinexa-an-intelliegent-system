'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, AlertCircle, Cloud, Leaf, TrendingUp, CheckCircle2, HandCoins, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, useUser } from '@/firebase';
import { useLocation } from '@/hooks/use-location';
import { signOut } from 'firebase/auth';
import { useTranslation } from '@/hooks/use-translation';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';


export default function AppHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { t, language, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');

  const { selectedDistrict } = useLocation();

  // Use the dynamic notifications hook (pass selected district for VajraSOS alerts)
  const {
    notifications,
    loading: notificationsLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.uid, selectedDistrict?.district);

  // Load user photo from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserPhoto = async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserPhoto(snap.data().photoURL || '');
        }
      } catch (error) {
        console.error('Error loading user photo:', error);
      }
    };

    loadUserPhoto();
  }, [user?.uid]);

  // Icon mapping for notifications
  const iconMap: Record<string, any> = {
    Cloud,
    AlertCircle,
    Leaf,
    TrendingUp,
    HandCoins,
  };
  
  const handleLogout = () => {
    if (auth) {
      router.push('/login');
      signOut(auth).catch((error) => {
        console.error('Sign out error:', error);
      });
    }
  };

  const getAvatarFallback = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Route to a search results page with the query
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const quickSearchOptions = [
    { label: t('Dashboard', 'Dashboard'), path: '/' },
    { label: t('Voice Assistant', 'Voice Assistant'), path: '/chatbot' },
    { label: t('Disease Detection', 'Disease Detection'), path: '/disease-detection' },
    { label: t('Crop Recommendation', 'Crop Recommendation'), path: '/crop-recommendation' },
    { label: t('Soil Health', 'Soil Health'), path: '/sensors' },
    { label: t('Seasonal Planner', 'Seasonal Planner'), path: '/seasonal-planner' },
    { label: t('Weather', 'Weather'), path: '/weather' },
    { label: t('Market Prices', 'Market Prices'), path: '/market-prices' },
    { label: t('Loans & Subsidies', 'Loans & Subsidies'), path: '/loans-subsidies' },
    { label: t('Community', 'Community'), path: '/community' },
    { label: t('Settings', 'Settings'), path: '/settings' },
    { label: t('Profile', 'Profile'), path: '/profile' },
    { label: t('My Account', 'My Account'), path: '/profile' },
  ];

  const filteredOptions = searchQuery.trim()
    ? quickSearchOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="relative w-full max-w-xs hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('Search features...', 'Search features...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full rounded-lg bg-card pl-8 border-none"
        />
        {/* Quick search suggestions */}
        {filteredOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.path}
                onClick={() => {
                  router.push(option.path);
                  setSearchQuery('');
                }}
                className="w-full text-left px-4 py-2 hover:bg-green-50 border-b last:border-b-0 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[100px] border-none bg-card">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="kn">Kannada</SelectItem>
          </SelectContent>
        </Select>

        {/* Notifications Dropdown */}
        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t('Notifications', 'Notifications')}</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuLabel>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="w-full px-4 py-2 text-xs text-green-600 hover:bg-green-50 text-left"
              >
                {t('Mark all as read', 'Mark all as read')}
              </button>
            )}
            
            <DropdownMenuSeparator />

            {notificationsLoading ? (
              <div className="px-4 py-8 text-center flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-0">
                {notifications.map((notification: Notification) => {
                  const Icon = iconMap[notification.icon] || Cloud;
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {notification.currentCondition && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.currentCondition.description}
                              {notification.currentCondition.temp_c !== undefined && notification.currentCondition.temp_c !== null && (
                                <span className="ml-2">· {notification.currentCondition.temp_c.toFixed(1)}°C</span>
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.time).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-gray-600">
                  {t('No notifications', 'No notifications')}
                </p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userPhoto || user?.photoURL || undefined} alt="User avatar" />
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>{user?.displayName || t('My Account', 'My Account')}</p>
              <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>{t('Profile', 'Profile')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>{t('Settings', 'Settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              {t('Logout', 'Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
