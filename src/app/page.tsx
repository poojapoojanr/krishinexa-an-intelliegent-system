'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sprout, Leaf, TrendingUp, Shield, CloudSun, Calendar, 
  Microscope, TestTube, HandCoins, ChevronRight, Check, 
  MessageCircle, Phone, Mail, MapPin, Play, ArrowRight,
  Sparkles, Target, Clock, Users, Award, Heart, Mic
} from "lucide-react";
import Link from 'next/link';
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  
  return count;
}

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, inView };
}

// Hero Section
function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setLoaded(true);
  }, []);

  const highlights = [
    { value: '7+', label: 'Smart Features' },
    { value: 'AI', label: 'Powered Insights' },
    { value: '24/7', label: 'Weather Updates' },
    { value: '100%', label: 'Free to Use' },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white p-8 lg:p-16 mb-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-teal-300/10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }} />
        
        {/* Floating leaves animation */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`,
            }}
          >
            <Leaf className="w-8 h-8 text-white/30" />
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <div className={`transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="text-sm font-medium">{t('AI-Powered Smart Agriculture Platform', 'AI-Powered Smart Agriculture Platform')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight max-w-4xl">
            {t('Grow Smarter with', 'Grow Smarter with')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-green-200 to-emerald-200 mt-2">
              KrishiNexa
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
            {t('Your complete farming companion — from disease detection to market prices. Make data-driven decisions and maximize your harvest with AI-powered insights.', 'Your complete farming companion — from disease detection to market prices. Make data-driven decisions and maximize your harvest with AI-powered insights.')}
          </p>

          {/* Highlight pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {highlights.map((item, i) => (
              <div
                key={i}
                className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center transition-all duration-500 hover:bg-white/20 hover:scale-105 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <p className="text-2xl md:text-3xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-white/70 mt-1">{t(item.label, item.label)}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link href="/crop-recommendation">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 hover:scale-105 transition-transform shadow-xl shadow-black/20 px-8">
                {t('Get Started', 'Get Started')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/disease-detection">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                <Play className="mr-2 w-5 h-5" />
                {t('Try Disease Detection', 'Try Disease Detection')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Why Choose Section
function WhyChooseSection() {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  const reasons = [
    { icon: Target, title: 'Precision Farming', desc: 'AI-driven recommendations tailored to your specific soil and climate conditions' },
    { icon: Clock, title: 'Real-Time Updates', desc: 'Get instant weather alerts, market prices, and crop health notifications' },
    { icon: Shield, title: 'Expert Guidance', desc: 'Access proven agricultural practices and government scheme information' },
    { icon: Sparkles, title: 'Easy to Use', desc: 'Simple interface designed for farmers of all experience levels' },
    { icon: Heart, title: 'Sustainable Practices', desc: 'Eco-friendly recommendations for long-term soil health' },
    { icon: Award, title: 'Completely Free', desc: 'All features available at no cost to support Indian farmers' },
  ];

  return (
    <section ref={ref} className="mb-16">
      <div className="text-center mb-12">
        <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('Why Choose', 'Why Choose')} <span className="text-green-600">KrishiNexa?</span>
        </h2>
        <p className={`text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('Smart farming made simple. Everything you need to grow better crops, all in one place.', 'Smart farming made simple. Everything you need to grow better crops, all in one place.')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reasons.map((reason, i) => (
          <Card
            key={i}
            className={`group border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${200 + i * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <reason.icon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{t(reason.title, reason.title)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(reason.desc, reason.desc)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  const steps = [
    {
      step: '01',
      title: 'Choose Your Need',
      desc: 'Select from disease detection, crop recommendation, weather updates, or market prices',
      icon: Sprout,
      color: 'from-green-500 to-emerald-500',
    },
    {
      step: '02',
      title: 'Provide Information',
      desc: 'Upload a photo, enter your location, or input soil parameters for personalized results',
      icon: TestTube,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '03',
      title: 'Get AI Insights',
      desc: 'Receive instant, accurate recommendations powered by advanced machine learning',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: '04',
      title: 'Take Action',
      desc: 'Implement the suggestions and track your progress with seasonal planning tools',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section ref={ref} className="mb-16">
      <div className="text-center mb-12">
        <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('How', 'How')} <span className="text-green-600">KrishiNexa</span> {t('Works', 'Works')}
        </h2>
        <p className={`text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('Get started in minutes with our simple 4-step process', 'Get started in minutes with our simple 4-step process')}
        </p>
      </div>

      <div className="relative">
        {/* Connection line */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-blue-200 via-purple-200 to-orange-200 -translate-y-1/2 rounded-full" />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white overflow-hidden group">
                <CardContent className="p-6 text-center relative">
                  {/* Step number badge */}
                  <div className={`absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.step}
                  </div>
                  
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{t(step.title, step.title)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(step.desc, step.desc)}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Services/Features Grid
function ServicesSection() {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  const services = [
    {
      icon: Mic,
      title: 'Voice Assistant',
      desc: 'Talk to our AI assistant in Kannada, Hindi, or English. Get instant farming advice using voice commands',
      href: '/chatbot',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50',
      badge: 'Multilingual',
    },
    {
      icon: Microscope,
      title: 'Disease Detection',
      desc: 'Upload a photo of your crop and get instant AI-powered disease diagnosis with treatment recommendations',
      href: '/disease-detection',
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50',
    },
    {
      icon: Sprout,
      title: 'Crop Recommendation',
      desc: 'Get personalized crop suggestions based on your soil type, climate, and market conditions',
      href: '/crop-recommendation',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    {
      icon: TestTube,
      title: 'Soil Health Analysis',
      desc: 'Monitor NPK levels, pH, moisture and get fertilizer recommendations for optimal growth',
      href: '/sensors',
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
    },
    {
      icon: CloudSun,
      title: 'Weather Forecasts',
      desc: 'Access accurate 7-day forecasts with farming-specific alerts for irrigation and harvesting',
      href: '/weather',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
    },
    {
      icon: TrendingUp,
      title: 'Market Prices',
      desc: 'Track real-time mandi prices across India and find the best time and place to sell',
      href: '/market-prices',
      gradient: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50',
    },
    {
      icon: Calendar,
      title: 'Seasonal Planner',
      desc: 'Plan your farming calendar with sowing, irrigation, and harvesting schedules',
      href: '/seasonal-planner',
      gradient: 'from-teal-500 to-green-500',
      bgGradient: 'from-teal-50 to-green-50',
    },
    {
      icon: HandCoins,
      title: 'Loans & Subsidies',
      desc: 'Discover government schemes, subsidies, and loan programs you\'re eligible for',
      href: '/loans-subsidies',
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-50 to-amber-50',
    },
  ];

  return (
    <section ref={ref} className="mb-16">
      <div className="text-center mb-12">
        <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('Our', 'Our')} <span className="text-green-600">{t('Services', 'Services')}</span>
        </h2>
        <p className={`text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {t('Comprehensive tools designed to support every aspect of your farming journey', 'Comprehensive tools designed to support every aspect of your farming journey')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service, i) => (
          <Link key={i} href={service.href}>
            <Card
              className={`group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer overflow-hidden bg-gradient-to-br ${service.bgGradient} ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                  {t(service.title, service.title)}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                  {t(service.desc, service.desc)}
                </p>
                
                <div className="mt-4 flex items-center text-green-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                  {t('Explore', 'Explore')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  const faqs = [
    {
      q: 'Is KrishiNexa free to use?',
      a: 'Yes! KrishiNexa is completely free for all farmers. Our mission is to empower Indian agriculture through technology.',
    },
    {
      q: 'How accurate is the disease detection?',
      a: 'Our AI model is trained on thousands of crop images and achieves over 90% accuracy for common diseases. We continuously improve it with more data.',
    },
    {
      q: 'Do I need internet to use KrishiNexa?',
      a: 'Yes, an internet connection is required to access our AI-powered features, weather data, and market prices. We recommend a stable mobile data or WiFi connection.',
    },
    {
      q: 'Which crops does KrishiNexa support?',
      a: 'We support major crops including rice, wheat, maize, cotton, sugarcane, vegetables, and pulses. We\'re continuously adding support for more crops.',
    },
    {
      q: 'How do I get crop recommendations?',
      a: 'Simply enter your location and soil parameters (or use our soil health feature), and our AI will recommend the best crops based on your conditions and current market prices.',
    },
    {
      q: 'Can I access government scheme information?',
      a: 'Yes! Our Loans & Subsidies section provides information about various government schemes, subsidies, and agricultural loans you may be eligible for.',
    },
  ];

  return (
    <section ref={ref} className="mb-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {t('Frequently Asked', 'Frequently Asked')} <span className="text-green-600">{t('Questions', 'Questions')}</span>
          </h2>
          <p className={`text-gray-600 transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {t('Got questions? We\'ve got answers.', 'Got questions? We\'ve got answers.')}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={`bg-white rounded-xl border-0 shadow-md overflow-hidden transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-green-50 text-left font-medium text-gray-900">
                {t(faq.q, faq.q)}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 leading-relaxed">
                {t(faq.a, faq.a)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// Contact/CTA Section
function ContactSection() {
  const { ref, inView } = useInView();
  const { t } = useTranslation();

  return (
    <section ref={ref} className="mb-8">
      <Card className={`border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <CardContent className="p-8 lg:p-12 relative">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('Ready to Transform Your Farming?', 'Ready to Transform Your Farming?')}
                </h2>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  {t('Join thousands of farmers already using KrishiNexa to grow smarter, earn more, and farm sustainably.', 'Join thousands of farmers already using KrishiNexa to grow smarter, earn more, and farm sustainably.')}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link href="/crop-recommendation">
                    <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 hover:scale-105 transition-transform">
                      {t('Start Now', 'Start Now')}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone, label: 'Voice Assistant', desc: 'Talk to our AI', href: '#' },
                  { icon: MessageCircle, label: 'Chat Support', desc: 'Get help anytime', href: '#' },
                  { icon: Mail, label: 'Email Us', desc: 'majorprojectsjce2026@gmail.com', href: 'mailto:majorprojectsjce2026@gmail.com' },
                  { icon: Users, label: 'Community', desc: 'Share your feedback', href: '/community' },
                ].map((item, i) => (
                  <Link key={i} href={item.href}>
                    <div
                      className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ transitionDelay: `${400 + i * 100}ms` }}
                    >
                      <item.icon className="w-6 h-6 text-white/80 mb-2" />
                      <p className="font-semibold text-white text-sm">{t(item.label, item.label)}</p>
                      <p className="text-xs text-white/60 mt-1">{t(item.desc, item.desc)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// Main Page Component
export default function Page() {
  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HeroSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <ServicesSection />
        <FAQSection />
        <ContactSection />
      </div>
      
      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

