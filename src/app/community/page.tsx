'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  MessageSquare, Send, CheckCircle2, Loader2, 
  User, Mail, Phone, MapPin, AlertCircle,
  ThumbsUp, HelpCircle, Bug, Lightbulb, Heart
} from "lucide-react";
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from '@/hooks/use-translation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

type FeedbackType = 'query' | 'feedback' | 'bug' | 'suggestion' | 'appreciation';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  district?: string;
  state?: string;
}

export default function CommunityPage() {
  const { t } = useTranslation();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('query');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch user profile from Firestore
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user || !db) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Combine firstName and lastName for display
          const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
          setUserProfile({
            name: fullName || data.name || data.displayName || user.displayName || '',
            email: data.email || user.email || '',
            phone: data.phone || data.phoneNumber || '',
            location: data.location || '',
            district: data.district || '',
            state: data.state || '',
          });
        } else {
          // Use auth profile if no Firestore profile
          setUserProfile({
            name: user.displayName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Fallback to auth data
        setUserProfile({
          name: user.displayName || '',
          email: user.email || '',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchUserProfile();
  }, [user, db]);

  const feedbackTypes = [
    { value: 'query', label: 'Ask a Question', icon: HelpCircle, color: 'text-blue-500' },
    { value: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-green-500' },
    { value: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-red-500' },
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'appreciation', label: 'Appreciation', icon: Heart, color: 'text-pink-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please login to submit feedback');
      return;
    }

    if (!db) {
      setError('Database connection error. Please try again.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter your message');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'communityFeedback'), {
        // User info (auto-fetched)
        userId: user.uid,
        userName: userProfile.name || 'Anonymous',
        userEmail: userProfile.email || '',
        userPhone: userProfile.phone || '',
        userLocation: userProfile.location || '',
        userDistrict: userProfile.district || '',
        userState: userProfile.state || '',
        
        // Feedback data
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
        
        // Metadata
        status: 'pending', // pending, reviewed, resolved
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // For admin response
        adminResponse: null,
        respondedAt: null,
        respondedBy: null,
      });

      setIsSubmitted(true);
      setSubject('');
      setMessage('');
      setFeedbackType('query');

      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-full py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('Login Required', 'Login Required')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('Please login to submit your queries and feedback to our community.', 'Please login to submit your queries and feedback to our community.')}
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  {t('Login to Continue', 'Login to Continue')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-4">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {t('KrishiNexa Community', 'KrishiNexa Community')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('We\'d Love to Hear From You!', 'We\'d Love to Hear From You!')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('Have a question, suggestion, or feedback? Share it with us and help make KrishiNexa better for all farmers.', 'Have a question, suggestion, or feedback? Share it with us and help make KrishiNexa better for all farmers.')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <Card className="lg:col-span-1 border-0 shadow-lg h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                {t('Your Information', 'Your Information')}
              </CardTitle>
              <CardDescription>
                {t('Auto-filled from your account', 'Auto-filled from your account')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('Name', 'Name')}</p>
                      <p className="font-medium text-gray-900">
                        {userProfile.name || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('Email', 'Email')}</p>
                      <p className="font-medium text-gray-900 text-sm break-all">
                        {userProfile.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {userProfile.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t('Phone', 'Phone')}</p>
                        <p className="font-medium text-gray-900">{userProfile.phone}</p>
                      </div>
                    </div>
                  )}

                  {(userProfile.district || userProfile.state || userProfile.location) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t('Location', 'Location')}</p>
                        <p className="font-medium text-gray-900">
                          {[userProfile.district, userProfile.state, userProfile.location]
                            .filter(Boolean)
                            .join(', ') || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link href="/profile" className="block">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      {t('Update Profile', 'Update Profile')}
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {t('Submit Your Query or Feedback', 'Submit Your Query or Feedback')}
              </CardTitle>
              <CardDescription>
                {t('Fill in the details below and we\'ll get back to you soon.', 'Fill in the details below and we\'ll get back to you soon.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {t('Thank you! Your submission has been received. We\'ll respond soon.', 'Thank you! Your submission has been received. We\'ll respond soon.')}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {t('What would you like to share?', 'What would you like to share?')}
                  </Label>
                  <RadioGroup
                    value={feedbackType}
                    onValueChange={(value) => setFeedbackType(value as FeedbackType)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {feedbackTypes.map((type) => (
                      <div key={type.value}>
                        <RadioGroupItem
                          value={type.value}
                          id={type.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={type.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${feedbackType === type.value 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <type.icon className={`w-5 h-5 ${type.color}`} />
                          <span className="text-sm font-medium">{t(type.label, type.label)}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-base font-medium">
                    {t('Subject', 'Subject')} <span className="text-gray-400 text-sm font-normal">({t('Optional', 'Optional')})</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder={t('Brief title for your message...', 'Brief title for your message...')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-12"
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-medium">
                    {t('Your Message', 'Your Message')} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={t('Describe your question, feedback, or suggestion in detail...', 'Describe your question, feedback, or suggestion in detail...')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[150px] resize-none"
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {message.length}/2000 {t('characters', 'characters')}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('Submitting...', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('Submit', 'Submit')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-2">
            {t('You can also reach us directly at:', 'You can also reach us directly at:')}
          </p>
          <a 
            href="mailto:majorprojectsjce2026@gmail.com" 
            className="text-green-600 font-medium hover:underline"
          >
            majorprojectsjce2026@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
