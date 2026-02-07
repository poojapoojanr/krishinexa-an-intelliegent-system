'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Mic, MicOff, Loader2, User, CornerDownLeft, Sparkles, MapPin, VolumeX, Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { agenticVoiceChat } from '@/ai/flows/agentic-voice-chat';
import { LANGUAGE_CONFIG, type AgentMessage, type SupportedLanguage } from '@/ai/types/chat-types';
import { Input } from './ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/use-location';

// Language codes for Web Speech API (FREE, browser-based)
const WEB_SPEECH_LANG_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceChatbot() {
  const { t, language } = useTranslation();
  const { selectedDistrict, selectedTaluk, selectedVillage } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Build location string for context
  const locationString = [selectedVillage, selectedTaluk, selectedDistrict, 'Karnataka', 'India']
    .filter(Boolean)
    .join(', ');

  /**
   * Stop all audio output (TTS and audio player)
   */
  const stopAllAudio = useCallback(() => {
    // Stop Web Speech TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Handle popover open/close - stop audio and clear chat when closing
   */
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      stopAllAudio();
      // Clear chat history when closing
      setMessages([]);
      setTextInput('');
      setTranscript('');
    }
    setIsOpen(open);
  }, [stopAllAudio]);

  /**
   * FREE TTS using Web Speech API (browser-based)
   */
  const speakWithWebSpeech = useCallback((text: string, lang: SupportedLanguage) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Web Speech API not available');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Preprocess text for better TTS pronunciation
    let processedText = text
      // Fix NPK ratios like "10:10:10" → "10 10 10" (prevents time interpretation)
      .replace(/(\d+):(\d+):(\d+)/g, '$1 $2 $3')
      // Fix ratios like "4:2:1" → "4 to 2 to 1"
      .replace(/(\d+):(\d+)/g, '$1 to $2')
      // Fix "N:P:K" → "N P K"
      .replace(/N:P:K/gi, 'N P K')
      // Fix percentages being read weird
      .replace(/(\d+)%/g, '$1 percent');
    
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = WEB_SPEECH_LANG_CODES[lang];
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Track speaking state
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(lang === 'en' ? 'en' : lang === 'hi' ? 'hi' : 'kn'));
    if (langVoice) {
      utterance.voice = langVoice;
    }
    
    window.speechSynthesis.speak(utterance);
    console.log(`🔊 TTS (Web Speech - FREE): Speaking in ${lang}`);
  }, []);

  /**
   * Play audio response - tries server audio first, falls back to Web Speech (FREE)
   */
  const playAudioResponse = useCallback((audioUri: string | undefined, text: string, lang: SupportedLanguage) => {
    if (audioUri && audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUri;
      audioPlayerRef.current.play().catch(e => {
        console.error("Audio playback failed, using Web Speech fallback:", e);
        speakWithWebSpeech(text, lang);
      });
    } else {
      // Use FREE Web Speech TTS
      speakWithWebSpeech(text, lang);
    }
  }, [speakWithWebSpeech]);

  // Initialize greeting based on language
  useEffect(() => {
    if (language === 'kn') setSelectedLang('kn');
    else if (language === 'hi') setSelectedLang('hi');
    else setSelectedLang('en');
  }, [language]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: LANGUAGE_CONFIG[selectedLang].greeting,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [isOpen, selectedLang]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * FREE Speech-to-Text using Web Speech API (browser-based)
   * Works great with Hindi (hi-IN), Kannada (kn-IN), English (en-IN)
   */
  const handleMicClick = async () => {
    // INTERRUPT: Stop any ongoing TTS when user wants to speak
    stopAllAudio();
    
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: t('Browser Not Supported', 'Browser Not Supported'),
        description: t(
          'Speech recognition is not supported. Please use Chrome, Edge, or Safari.',
          'Speech recognition is not supported. Please use Chrome, Edge, or Safari.'
        ),
        duration: 5000,
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // Configure recognition for Indian languages
      recognition.lang = WEB_SPEECH_LANG_CODES[selectedLang];
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      
      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('');
        toast({
          title: '🎤 Listening...',
          description: selectedLang === 'hi' ? 'बोलें... (क्लिक करके रोकें)' 
            : selectedLang === 'kn' ? 'ಮಾತನಾಡಿ... (ನಿಲ್ಲಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ)'
            : 'Speak now... (Click to stop)',
          duration: 2000,
        });
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Show live transcript
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        if (event.error === 'not-allowed') {
          toast({
            variant: 'destructive',
            title: t('Microphone Blocked', 'Microphone Blocked'),
            description: t('Please allow microphone access in your browser settings.', 'Please allow microphone access in your browser settings.'),
          });
        } else if (event.error !== 'aborted') {
          toast({
            variant: 'destructive',
            title: t('Recognition Error', 'Recognition Error'),
            description: t('Could not understand speech. Please try again.', 'Could not understand speech. Please try again.'),
          });
        }
      };
      
      recognition.onend = async () => {
        setIsRecording(false);
        
        const textToProcess = finalTranscript.trim();
        if (textToProcess) {
          // Process the transcribed text (FREE - no API call for STT!)
          await processTextInput(textToProcess);
        }
        
        setTranscript('');
      };
      
      recognition.start();
      
    } catch (error: any) {
      console.error('Speech recognition error:', error);
      setIsRecording(false);
      toast({
        variant: 'destructive',
        title: t('Error', 'Error'),
        description: t('Could not start speech recognition.', 'Could not start speech recognition.'),
      });
    }
  };

  /**
   * Process text input (from typing or speech recognition)
   */
  const processTextInput = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: AgentMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setIsLoading(true);

    try {
      const result = await agenticVoiceChat({ 
        textInput: text.trim(),  // Send as text, not audio (FREE!)
        history: [...messages, userMessage],
        language: selectedLang,
        location: locationString || undefined,
      });
      setMessages(result.history);

      // Get the last assistant message for TTS
      const lastAssistantMsg = result.history.filter(m => m.role === 'assistant').pop();
      const responseText = lastAssistantMsg?.content || '';
      const responseLang = result.detectedLanguage || selectedLang;
      
      // Use FREE Web Speech TTS (no Gemini TTS needed!)
      playAudioResponse(result.responseAudioUri, responseText, responseLang);
      
      // Show tools used
      if (result.toolsUsed && result.toolsUsed.length > 0) {
        toast({
          title: '🔧 Tools Used',
          description: result.toolsUsed.join(', '),
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error processing chat:', error);
      toast({
        variant: 'destructive',
        title: t('AI Error', 'AI Error'),
        description: t('Failed to get a response. Please try again.', 'Failed to get a response. Please try again.'),
      });
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: t('Sorry, I had trouble responding. Please try again.', 'Sorry, I had trouble responding. Please try again.'),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // INTERRUPT: Stop any ongoing TTS when user submits text
    stopAllAudio();
    await processTextInput(textInput);
  };

  // INTERRUPT: Stop TTS when user starts typing
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length === 1 && textInput.length === 0) {
      // User just started typing - stop any ongoing speech
      stopAllAudio();
    }
    setTextInput(e.target.value);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
            size="icon"
          >
            <Bot className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-[400px] h-[550px] p-0 rounded-lg shadow-2xl mr-4 mb-2"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Accessibility labels */}
          <span className="sr-only">AI Assistant Chat - A chat window with the KrishiNexa AI agent. You can type or speak your questions.</span>
          <Card className="h-full w-full flex flex-col border-0">
            <CardHeader className="flex-col gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg py-3 px-4">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="h-5 w-5" /> 
                  <span>KrishiNexa AI</span>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs ml-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Agent
                  </Badge>
                </CardTitle>
                <div className="flex gap-1">
                  {(['en', 'hi', 'kn'] as SupportedLanguage[]).map((lang) => (
                    <Button
                      key={lang}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-xs text-white hover:bg-white/20",
                      selectedLang === lang && "bg-white/30"
                    )}
                    onClick={() => setSelectedLang(lang)}
                  >
                    {lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'ಕ'}
                  </Button>
                ))}
                </div>
              </div>
              {/* Location indicator */}
              {(selectedDistrict || selectedTaluk) && (
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[300px]">
                    {[selectedVillage, selectedTaluk, selectedDistrict].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <audio ref={audioPlayerRef} className="hidden" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden p-3">
              <ScrollArea className="flex-1 pr-2" ref={scrollAreaRef}>
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 ${
                        msg.role === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {msg.role === 'assistant' && <AvatarIcon type="bot" />}
                      <div
                        className={`max-w-[80%] rounded-xl p-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-green-600 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
                            {msg.toolCalls.map((tc, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tc.tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && <AvatarIcon type="user" />}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-2">
                      <AvatarIcon type="bot" />
                      <div className="max-w-[80%] rounded-xl p-3 text-sm bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                  {/* Live transcript while speaking */}
                  {isRecording && transcript && (
                    <div className="flex items-start gap-2 justify-end">
                      <div className="max-w-[80%] rounded-xl p-3 text-sm bg-green-100 text-green-800 italic border-2 border-dashed border-green-300">
                        🎤 {transcript}...
                      </div>
                      <AvatarIcon type="user" />
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 pt-2 border-t">
                <form onSubmit={handleTextInputSubmit} className="flex-1 relative">
                  <Input 
                    placeholder={
                      selectedLang === 'hi' ? 'टाइप करें या माइक दबाएं...' 
                      : selectedLang === 'kn' ? 'ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ...'
                      : 'Type or press mic...'
                    }
                    value={textInput}
                    onChange={handleTextInputChange}
                    disabled={isLoading || isRecording}
                    className="pr-10"
                  />
                  <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={!textInput.trim() || isLoading || isRecording}>
                    <CornerDownLeft className="h-4 w-4" />
                  </Button>
                </form>
                {/* Stop Speaking Button - shows when AI is speaking */}
                {isSpeaking && (
                  <Button
                    size="icon"
                    onClick={stopAllAudio}
                    variant="destructive"
                    className="rounded-full animate-pulse"
                    title="Stop speaking"
                  >
                    <VolumeX className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  variant={isRecording ? 'destructive' : 'default'}
                  className={cn(
                    "rounded-full",
                    !isRecording && !isSpeaking && "bg-green-600 hover:bg-green-700",
                    isRecording && "animate-pulse"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </>
  );
}

function AvatarIcon({ type }: { type: 'user' | 'bot' }) {
  const icon = type === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />;
  const bgColor = type === 'bot' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${bgColor} flex-shrink-0`}>
      {icon}
    </div>
  );
}
