'use client';

import { useEffect, useState } from "react";
import { User, Globe, Moon, Sun, Save, Loader2, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { useUser } from "@/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { getAuth, deleteUser } from "firebase/auth";

/* ---------------- TYPES ---------------- */

type Language = "en" | "kn" | "hi";

/* ---------------- MAIN COMPONENT ---------------- */

export default function SettingsPage() {
  /* ---------- STATE ---------- */
  const { t, language: appLanguage, setLanguage: setAppLanguage } = useTranslation();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    district: '',
    language: 'en' as Language,
    email: '',
    photoURL: '',
  });

  /* ---------- LOAD PROFILE FROM FIRESTORE ---------- */
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          phone: data.phone ?? '',
          district: data.district ?? '',
          language: (data.language ?? 'en') as Language,
          email: data.email ?? user.email ?? '',
          photoURL: data.photoURL ?? '',
        });
        setPhotoPreview(data.photoURL ?? '');
      } else {
        setForm({
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

  /* ---------- LOAD THEME SETTINGS ---------- */
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  /* ---------- HANDLERS ---------- */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Convert to base64 and store
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setForm({ ...form, photoURL: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setForm({ ...form, photoURL: '' });
  };

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update language in app context
      if (form.language !== appLanguage) {
        setAppLanguage(form.language);
      }

      // Save to Firestore
      await setDoc(
        doc(db, 'users', user.uid),
        { ...form },
        { merge: true }
      );

      toast({
        title: t('Settings updated ✅', 'Settings updated ✅'),
        description: t('Your changes have been saved successfully.', 'Your changes have been saved successfully.'),
      });
    } catch (error: any) {
      toast({
        title: t('Error saving settings', 'Error saving settings'),
        description: error?.message ?? t('Failed to save settings', 'Failed to save settings'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Delete Firestore document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete Firebase Auth user
      await deleteUser(currentUser);

      toast({
        title: t('Account deleted', 'Account deleted'),
        description: t('Your account has been permanently deleted.', 'Your account has been permanently deleted.'),
      });

      // Redirect to login after deletion
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      toast({
        title: t('Error deleting account', 'Error deleting account'),
        description: error?.message ?? t('Failed to delete account', 'Failed to delete account'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('Settings', 'Settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('Manage your account and application preferences', 'Manage your account and application preferences')}
        </p>
      </div>

      {/* PROFILE SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            {t('Profile Settings', 'Profile Settings')}
          </CardTitle>
          <CardDescription>
            {t('Update your personal information', 'Update your personal information')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Photo */}
          <div className="space-y-3">
            <Label>{t('Profile Photo', 'Profile Photo')}</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Photo Preview */}
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="h-24 w-24 rounded-lg object-cover border-2 border-green-200"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex-1">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button variant="outline" asChild className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {t('Upload Photo', 'Upload Photo')}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  {t('JPG, PNG or GIF (max. 5MB)', 'JPG, PNG or GIF (max. 5MB)')}
                </p>
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <Label>{t('Email', 'Email')}</Label>
            <Input value={form.email} disabled />
          </div>

          {/* First Name */}
          <div>
            <Label>{t('First Name', 'First Name')}</Label>
            <Input
              placeholder={t('Enter your first name', 'Enter your first name')}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>{t('Last Name', 'Last Name')}</Label>
            <Input
              placeholder={t('Enter your last name', 'Enter your last name')}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <Label>{t('Mobile Number', 'Mobile Number')}</Label>
            <Input
              placeholder="9XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* District */}
          <div>
            <Label>{t('District', 'District')}</Label>
            <Input
              placeholder={t('Enter your district', 'Enter your district')}
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* APPLICATION SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            {t('Application Settings', 'Application Settings')}
          </CardTitle>
          <CardDescription>
            {t('Customize your experience', 'Customize your experience')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* LANGUAGE */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('Language', 'Language')}</Label>
              <p className="text-sm text-gray-500">
                {t('Choose your preferred language', 'Choose your preferred language')}
              </p>
            </div>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as Language })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('English', 'English')}</SelectItem>
                <SelectItem value="kn">{t('Kannada', 'ಕನ್ನಡ')}</SelectItem>
                <SelectItem value="hi">{t('Hindi', 'हिन्दी')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* THEME */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="text-yellow-500" />
              ) : (
                <Sun className="text-orange-500" />
              )}
              <div>
                <Label>{t('Theme', 'Theme')}</Label>
                <p className="text-sm text-gray-500">
                  {t('Toggle light or dark mode', 'Toggle light or dark mode')}
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleThemeToggle} />
          </div>

        </CardContent>
      </Card>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {t('Save Changes', 'Save Changes')}
        </Button>
      </div>

      {/* DANGER ZONE - DELETE ACCOUNT */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            {t('Danger Zone', 'Danger Zone')}
          </CardTitle>
          <CardDescription className="text-red-600">
            {t('Irreversible actions', 'Irreversible actions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {t('Delete your account and all associated data permanently. This action cannot be undone.', 'Delete your account and all associated data permanently. This action cannot be undone.')}
            </p>
            
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('Delete Account', 'Delete Account')}
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-white rounded-md border border-red-300">
                <p className="text-sm font-semibold text-red-700">
                  {t('Are you sure? This cannot be undone.', 'Are you sure? This cannot be undone.')}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    {t('Cancel', 'Cancel')}
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('Yes, Delete', 'Yes, Delete')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
