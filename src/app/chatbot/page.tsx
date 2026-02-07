'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bot, Mic, MicOff, Loader2, Volume2, User, Send, 
  Languages, Sparkles, MessageCircle, Phone, HelpCircle,
  Leaf, CloudSun, TrendingUp, Sprout, Wrench, RefreshCw,
  CircleDot, Zap, Shield, Coins, VolumeX
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { agenticVoiceChat } from '@/ai/flows/agentic-voice-chat';
import { LANGUAGE_CONFIG, type AgentMessage, type SupportedLanguage } from '@/ai/types/chat-types';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/use-location';

// Tool icons mapping
const TOOL_ICONS: Record<string, any> = {
  getWeatherInfo: CloudSun,
  recommendCrop: Sprout,
  diagnosePlantDisease: Leaf,
  getSeasonalPlan: TrendingUp,
  getSoilHealthAdvice: CircleDot,
  getMarketPrices: Coins,
  getGovernmentSchemes: Shield,
  getPestControlAdvice: Zap,
};

// Tool display names
const TOOL_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  getWeatherInfo: { en: 'Weather', hi: 'मौसम', kn: 'ಹವಾಮಾನ' },
  recommendCrop: { en: 'Crop Advice', hi: 'फसल सलाह', kn: 'ಬೆಳೆ ಸಲಹೆ' },
  diagnosePlantDisease: { en: 'Disease Check', hi: 'रोग जांच', kn: 'ರೋಗ ಪರೀಕ್ಷೆ' },
  getSeasonalPlan: { en: 'Season Plan', hi: 'मौसम योजना', kn: 'ಋತು ಯೋಜನೆ' },
  getSoilHealthAdvice: { en: 'Soil Health', hi: 'मिट्टी स्वास्थ्य', kn: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ' },
  getMarketPrices: { en: 'Market Prices', hi: 'बाजार भाव', kn: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ' },
  getGovernmentSchemes: { en: 'Govt Schemes', hi: 'सरकारी योजनाएं', kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು' },
  getPestControlAdvice: { en: 'Pest Control', hi: 'कीट नियंत्रण', kn: 'ಕೀಟ ನಿಯಂತ್ರಣ' },
};

// Suggested questions with translations
const suggestedQuestions = [
  { 
    icon: CloudSun, 
    text: 'What\'s the weather like today?', 
    textKn: 'ಇಂದು ಹವಾಮಾನ ಹೇಗಿದೆ?', 
    textHi: 'आज मौसम कैसा है?',
    tools: ['getWeatherInfo']
  },
  { 
    icon: Sprout, 
    text: 'What crop should I plant this season?', 
    textKn: 'ಈ ಸೀಸನ್‌ನಲ್ಲಿ ಯಾವ ಬೆಳೆ ಬೆಳೆಯಬೇಕು?', 
    textHi: 'इस सीजन में कौन सी फसल लगाऊं?',
    tools: ['recommendCrop', 'getSeasonalPlan']
  },
  { 
    icon: Leaf, 
    text: 'My tomato leaves have yellow spots', 
    textKn: 'ನನ್ನ ಟೊಮೆಟೊ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಕಲೆಗಳಿವೆ', 
    textHi: 'मेरे टमाटर की पत्तियों पर पीले धब्बे हैं',
    tools: ['diagnosePlantDisease']
  },
  { 
    icon: Coins, 
    text: 'What is the current price of rice?', 
    textKn: 'ಅಕ್ಕಿಯ ಪ್ರಸ್ತುತ ಬೆಲೆ ಏನು?', 
    textHi: 'चावल का वर्तमान भाव क्या है?',
    tools: ['getMarketPrices']
  },
  { 
    icon: Shield, 
    text: 'Tell me about PM-KISAN scheme', 
    textKn: 'PM-KISAN ಯೋಜನೆ ಬಗ್ಗೆ ಹೇಳಿ', 
    textHi: 'PM-KISAN योजना के बारे में बताइए',
    tools: ['getGovernmentSchemes']
  },
  { 
    icon: Zap, 
    text: 'How to control pests in cotton?', 
    textKn: 'ಹತ್ತಿಯಲ್ಲಿ ಕೀಟಗಳನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸುವುದು?', 
    textHi: 'कपास में कीटों को कैसे नियंत्रित करें?',
    tools: ['getPestControlAdvice']
  },
];

// Language labels
const LANGUAGE_LABELS: Record<SupportedLanguage, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  hi: { native: 'हिंदी', english: 'Hindi' },
  kn: { native: 'ಕನ್ನಡ', english: 'Kannada' },
};

export default function AgenticChatbotPage() {
  const { t, language: appLanguage } = useTranslation();
  const { selectedDistrict, selectedTaluk, selectedVillage, locationString } = useLocation();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize with greeting
  useEffect(() => {
    const greeting = LANGUAGE_CONFIG[selectedLang].greeting;
    setMessages([{
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  // Update greeting when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const greeting = LANGUAGE_CONFIG[selectedLang].greeting;
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [selectedLang]);

  // Sync with app language
  useEffect(() => {
    if (appLanguage === 'kn') setSelectedLang('kn');
    else if (appLanguage === 'hi') setSelectedLang('hi');
    else setSelectedLang('en');
  }, [appLanguage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Build user context from location hook
  const getUserContext = useCallback(() => {
    if (!selectedDistrict) return undefined;
    return {
      location: selectedVillage?.village || selectedTaluk?.taluk || locationString,
      district: selectedDistrict?.district || undefined,
      state: 'Karnataka', // Karnataka is the state for all districts in this app
    };
  }, [selectedDistrict, selectedTaluk, selectedVillage, locationString]);

  // Handle microphone recording
  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Check if mediaDevices API is available (not available in VS Code Simple Browser)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: t('Browser Not Supported', 'Browser Not Supported'),
          description: t(
            'Microphone is not available. Please open this page in Chrome, Edge, or Firefox at http://localhost:9002/chatbot',
            'Microphone is not available. Please open this page in Chrome, Edge, or Firefox at http://localhost:9002/chatbot'
          ),
          duration: 6000,
        });
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          } 
        });
        
        // Check for supported MIME types
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
        
        const options = mimeType ? { mimeType } : undefined;
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.onstop = async () => {
          const actualMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          audioChunksRef.current = [];
          stream.getTracks().forEach(track => track.stop());
          
          if (audioBlob.size > 0) {
            await processInput(undefined, audioBlob);
          } else {
            toast({
              variant: 'destructive',
              title: t('Recording Error', 'Recording Error'),
              description: t('No audio was captured. Please try again.', 'No audio was captured. Please try again.'),
            });
          }
        };
        
        // Request data every 250ms to ensure we capture audio
        mediaRecorderRef.current.start(250);
        setIsRecording(true);
        
        toast({
          title: selectedLang === 'hi' ? '🎤 रिकॉर्डिंग...' : selectedLang === 'kn' ? '🎤 ರೆಕಾರ್ಡಿಂಗ್...' : '🎤 Recording...',
          description: selectedLang === 'hi' ? 'अभी बोलें। रोकने के लिए फिर से क्लिक करें।' 
            : selectedLang === 'kn' ? 'ಈಗ ಮಾತನಾಡಿ. ನಿಲ್ಲಿಸಲು ಮತ್ತೆ ಕ್ಲಿಕ್ ಮಾಡಿ.'
            : 'Speak now. Click again to stop.',
          duration: 2000,
        });
      } catch (error: any) {
        console.error('Error accessing microphone:', error);
        
        let errorMessage = t('Could not access the microphone. Please check permissions.', 'Could not access the microphone. Please check permissions.');
        
        if (error.name === 'NotAllowedError') {
          errorMessage = t('Microphone permission denied. Please allow access in your browser settings.', 'Microphone permission denied. Please allow access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          errorMessage = t('No microphone found. Please connect a microphone.', 'No microphone found. Please connect a microphone.');
        } else if (error.name === 'NotReadableError') {
          errorMessage = t('Microphone is in use by another application.', 'Microphone is in use by another application.');
        }
        
        toast({
          variant: 'destructive',
          title: t('Microphone Error', 'Microphone Error'),
          description: errorMessage,
        });
      }
    }
  };

  // Process user input (text or audio)
  const processInput = async (text?: string, audioBlob?: Blob) => {
    setIsLoading(true);

    try {
      let audioDataUri: string | undefined;
      
      if (audioBlob) {
        audioDataUri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => resolve(reader.result as string);
        });
      }

      // Add user message immediately if text
      if (text) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString(),
        }]);
      }

      const currentMessages = text 
        ? [...messages, { role: 'user' as const, content: text, timestamp: new Date().toISOString() }] 
        : messages;

      const result = await agenticVoiceChat({
        textInput: text,
        audioDataUri,
        language: selectedLang,
        history: currentMessages,
        userContext: getUserContext(),
      });

      setMessages(result.history);

      // Update language if detected differently from voice
      if (result.detectedLanguage && result.detectedLanguage !== selectedLang) {
        setSelectedLang(result.detectedLanguage);
        toast({
          title: '🌐 Language Detected',
          description: `Switched to ${LANGUAGE_LABELS[result.detectedLanguage].english}`,
          duration: 2000,
        });
      }

      // Play audio response if not muted
      if (result.responseAudioUri && audioPlayerRef.current && !isMuted) {
        audioPlayerRef.current.src = result.responseAudioUri;
        setIsPlaying(true);
        audioPlayerRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
          setIsPlaying(false);
        });
      }

      // Show tools used toast
      if (result.toolsUsed && result.toolsUsed.length > 0) {
        const toolNames = result.toolsUsed.map(t => TOOL_NAMES[t]?.[selectedLang] || t).join(', ');
        toast({
          title: selectedLang === 'hi' ? '🔧 उपयोग किए गए टूल्स' : selectedLang === 'kn' ? '🔧 ಬಳಸಿದ ಉಪಕರಣಗಳು' : '🔧 Tools Used',
          description: toolNames,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        variant: 'destructive',
        title: t('AI Error', 'AI Error'),
        description: t('Failed to get a response. Please try again.', 'Failed to get a response. Please try again.'),
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: selectedLang === 'hi' ? 'क्षमा करें, मुझे जवाब देने में समस्या हुई। कृपया पुनः प्रयास करें।'
          : selectedLang === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯಿಸಲು ನನಗೆ ತೊಂದರೆಯಾಯಿತು. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text input submit
  const handleTextInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    
    const text = textInput.trim();
    setTextInput('');
    await processInput(text);
  };

  // Handle suggested question click
  const handleSuggestedQuestion = async (question: typeof suggestedQuestions[0]) => {
    if (isLoading) return;
    const text = selectedLang === 'kn' ? question.textKn 
      : selectedLang === 'hi' ? question.textHi 
      : question.text;
    await processInput(text);
  };

  // Clear chat
  const handleClearChat = () => {
    const greeting = LANGUAGE_CONFIG[selectedLang].greeting;
    setMessages([{
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString(),
    }]);
  };

  // Get question text based on language
  const getQuestionText = (q: typeof suggestedQuestions[0]) => {
    return selectedLang === 'kn' ? q.textKn : selectedLang === 'hi' ? q.textHi : q.text;
  };

  return (
    <div className="min-h-full py-4 px-2 sm:py-6 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full px-4 py-2 mb-3">
            <Bot className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('Agentic RAG Voice Assistant', 'Agentic RAG Voice Assistant')}
            </span>
            <Badge variant="secondary" className="bg-white dark:bg-gray-800 text-green-600 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              8 {t('Tools', 'Tools')}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {selectedLang === 'hi' ? 'अपने कृषि AI एजेंट से बात करें' 
              : selectedLang === 'kn' ? 'ನಿಮ್ಮ ಕೃಷಿ AI ಏಜೆಂಟ್‌ನೊಂದಿಗೆ ಮಾತನಾಡಿ'
              : 'Talk to Your Farming AI Agent'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
            {selectedLang === 'hi' ? 'मौसम, फसल, रोग, बाजार भाव, योजनाएं - सब कुछ एक जगह। बोलें या टाइप करें!' 
              : selectedLang === 'kn' ? 'ಹವಾಮಾನ, ಬೆಳೆ, ರೋಗ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಯೋಜನೆಗಳು - ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ. ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ!'
              : 'Weather, crops, diseases, market prices, schemes - all in one place. Speak or type!'}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Sidebar - Tools & Suggestions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Available Tools */}
            <Card className="border shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-green-600" />
                  {selectedLang === 'hi' ? 'उपलब्ध टूल्स' : selectedLang === 'kn' ? 'ಲಭ್ಯವಿರುವ ಉಪಕರಣಗಳು' : 'Available Tools'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(TOOL_NAMES).map(([key, names]) => {
                    const Icon = TOOL_ICONS[key];
                    return (
                      <Badge key={key} variant="outline" className="text-xs py-1 px-2">
                        <Icon className="h-3 w-3 mr-1 text-green-600" />
                        {names[selectedLang]}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            <Card className="border shadow-md hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-green-600" />
                  {selectedLang === 'hi' ? 'ये पूछें' : selectedLang === 'kn' ? 'ಇವು ಕೇಳಿ' : 'Try Asking'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {suggestedQuestions.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    disabled={isLoading}
                    className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 transition-colors">
                        <q.icon className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors leading-relaxed">
                        {getQuestionText(q)}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <Card className="lg:col-span-3 border shadow-xl overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
            {/* Chat Header */}
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">KrishiNexa AI Agent</CardTitle>
                    <p className="text-white/80 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                      {selectedLang === 'hi' ? 'ऑनलाइन • 8 टूल्स सक्रिय' 
                        : selectedLang === 'kn' ? 'ಆನ್‌ಲೈನ್ • 8 ಉಪಕರಣಗಳು ಸಕ್ರಿಯ'
                        : 'Online • 8 Tools Active'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Language Selector */}
                  <div className="flex bg-white/20 rounded-lg p-0.5">
                    {(['en', 'hi', 'kn'] as SupportedLanguage[]).map((lang) => (
                      <Button
                        key={lang}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2.5 text-xs text-white hover:text-white hover:bg-white/20",
                          selectedLang === lang && "bg-white/30"
                        )}
                        onClick={() => setSelectedLang(lang)}
                      >
                        {LANGUAGE_LABELS[lang].native}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Mute Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  {/* Clear Chat */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleClearChat}
                    title="Clear chat"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5",
                          message.role === 'user'
                            ? "bg-green-600 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {/* Show tools used */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {message.toolCalls.map((tc, i) => {
                              const Icon = TOOL_ICONS[tc.tool] || Wrench;
                              return (
                                <Badge key={i} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                  <Icon className="h-3 w-3 mr-1" />
                                  {TOOL_NAMES[tc.tool]?.[selectedLang] || tc.tool}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        
                        {message.timestamp && (
                          <p className={cn(
                            "text-xs mt-1.5 opacity-60",
                            message.role === 'user' ? "text-green-100" : "text-gray-500"
                          )}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          <span className="text-sm text-gray-500">
                            {selectedLang === 'hi' ? 'सोच रहा हूं और टूल्स चला रहा हूं...' 
                              : selectedLang === 'kn' ? 'ಯೋಚಿಸುತ್ತಿದೆ ಮತ್ತು ಉಪಕರಣಗಳನ್ನು ಚಾಲನೆ ಮಾಡುತ್ತಿದೆ...'
                              : 'Thinking & running tools...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Suggested Questions (Mobile - shown at start) */}
                {messages.length <= 1 && (
                  <div className="mt-4 lg:hidden">
                    <p className="text-xs text-gray-500 mb-2">
                      {selectedLang === 'hi' ? '💡 इनमें से कुछ पूछें:' : selectedLang === 'kn' ? '💡 ಇವುಗಳಲ್ಲಿ ಒಂದನ್ನು ಕೇಳಿ:' : '💡 Try asking:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestedQuestions.slice(0, 4).map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-start h-auto py-2 px-3 text-left text-xs"
                          onClick={() => handleSuggestedQuestion(q)}
                          disabled={isLoading}
                        >
                          <q.icon className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                          <span className="truncate">{getQuestionText(q)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-3 bg-gray-50 dark:bg-gray-900">
              <form onSubmit={handleTextInputSubmit} className="flex gap-2">
                {/* Voice Button */}
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  className={cn(
                    "flex-shrink-0 h-11 w-11 rounded-full transition-all",
                    isRecording && "animate-pulse ring-4 ring-red-200 dark:ring-red-900"
                  )}
                  onClick={handleMicClick}
                  disabled={isLoading}
                >
                  {isRecording ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Text Input */}
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    selectedLang === 'hi' ? 'अपना सवाल टाइप करें...' 
                    : selectedLang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...'
                    : 'Type your question...'
                  }
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isLoading || isRecording}
                  className="flex-1 h-11 text-sm"
                />
                
                {/* Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  className="flex-shrink-0 h-11 w-11 rounded-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading || isRecording || !textInput.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
              
              {/* Voice hint */}
              <p className="text-xs text-center text-gray-500 mt-2">
                {isRecording 
                  ? (selectedLang === 'hi' ? '🔴 रिकॉर्डिंग... बोलें, फिर रोकने के लिए क्लिक करें' 
                    : selectedLang === 'kn' ? '🔴 ರೆಕಾರ್ಡಿಂಗ್... ಮಾತನಾಡಿ, ನಂತರ ನಿಲ್ಲಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ'
                    : '🔴 Recording... Speak, then click to stop')
                  : (selectedLang === 'hi' ? '🎤 बोलने के लिए माइक दबाएं • English, हिंदी, ಕನ್ನಡ' 
                    : selectedLang === 'kn' ? '🎤 ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ • English, हिंदी, ಕನ್ನಡ'
                    : '🎤 Press mic to speak • English, हिंदी, ಕನ್ನಡ')
                }
              </p>
            </div>
          </Card>
        </div>

        {/* Hidden Audio Player */}
        <audio 
          ref={audioPlayerRef} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
}
