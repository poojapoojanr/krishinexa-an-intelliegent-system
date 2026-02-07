'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, isUserLoading } = useUser();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    district: '',
    language: 'en',
    email: '',
    photoURL: '',
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          phone: data.phone ?? '',
          district: data.district ?? '',
          language: data.language ?? 'en',
          email: data.email ?? user.email ?? '',
          photoURL: data.photoURL ?? '',
        });
      } else {
        setProfile({
          firstName: '',
          lastName: '',
          phone: '',
          district: '',
          language: 'en',
          email: user.email ?? '',
          photoURL: '',
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [user]);


  if (isUserLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6">
      <Card className="border-green-200 shadow-md">
        <CardHeader>
          <CardTitle>{t('My Account', 'My Account')}</CardTitle>
          <CardDescription>
            {t(
              'Your profile information from signup',
              'Your profile information from signup'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.firstName} 
                className="h-32 w-32 rounded-full object-cover border-4 border-green-200 shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-4 border-green-200 shadow-lg">
                <User className="h-16 w-16 text-green-600" />
              </div>
            )}
            <p className="text-sm text-gray-500">
              {t('To add or change your photo, visit Settings', 'To add or change your photo, visit Settings')}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('Email', 'Email')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">{profile.email}</p>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('First Name', 'First Name')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">{profile.firstName || '-'}</p>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('Last Name', 'Last Name')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">{profile.lastName || '-'}</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('Mobile Number', 'Mobile Number')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">{profile.phone || '-'}</p>
          </div>

          {/* District */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('District', 'District')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">{profile.district || '-'}</p>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('Preferred Language', 'Preferred Language')}</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md">
              {profile.language === 'en' ? 'English' : profile.language === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}
            </p>
          </div>

          <div className="text-sm text-gray-500 pt-4 border-t">
            {t('To update your details, please visit Settings', 'To update your details, please visit Settings')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
