'use server';
/**
 * @fileOverview A voice chatbot flow for the agriculture assistant.
 *
 * - voiceChat - A function that handles STT, chat logic, and TTS.
 * - VoiceChatInput - The input type for the voiceChat function.
 * - VoiceChatOutput - The return type for the voiceChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// Define schemas
const MessageSchema = z.object({
  sender: z.enum(['user', 'bot']),
  text: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

const VoiceChatInputSchema = z.object({
  audioDataUri: z.string().optional().describe(
    "A user's voice query, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Required if textInput is not provided."
  ),
  textInput: z.string().optional().describe(
    "A user's text query. Required if audioDataUri is not provided."
  ),
  history: z.array(MessageSchema).describe("The conversation history."),
});
export type VoiceChatInput = z.infer<typeof VoiceChatInputSchema>;

const VoiceChatOutputSchema = z.object({
  history: z.array(MessageSchema).describe("The updated conversation history."),
  responseAudioUri: z.string().optional().describe(
    "The bot's audio response as a data URI."
  ),
});
export type VoiceChatOutput = z.infer<typeof VoiceChatOutputSchema>;


// Exported wrapper function
export async function voiceChat(input: VoiceChatInput): Promise<VoiceChatOutput> {
  return voiceChatFlow(input);
}


// Main flow definition
const voiceChatFlow = ai.defineFlow(
  {
    name: 'voiceChatFlow',
    inputSchema: VoiceChatInputSchema,
    outputSchema: VoiceChatOutputSchema,
  },
  async (input) => {
    let userText = input.textInput;

    // 1. Speech-to-Text (if audio is provided)
    if (input.audioDataUri) {
      const { text } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: [
          { text: "Transcribe the following audio recording. The user is asking a question for an agricultural assistant app called KrishiSahayak. Respond only with the transcribed text." },
          { media: { url: input.audioDataUri } }
        ],
      });
      userText = text;
    }
    
    if (!userText) {
        // If no text could be derived, return current history
        return {
            history: input.history,
        };
    }
    
    const newHistory = [...input.history, { sender: 'user', text: userText }] as Message[];

    // 2. Chat Logic (get response from LLM)
    const chatHistory = newHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: [{ text: msg.text }],
    }));

    const { text: botResponseText } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are KrishiSahayak, a friendly and knowledgeable AI assistant for farmers. Your goal is to provide concise and helpful answers related to agriculture. Current date: ${new Date().toLocaleDateString()}`,
      history: chatHistory,
    });
    
    const finalHistory = [...newHistory, { sender: 'bot', text: botResponseText }];

    // 3. Text-to-Speech (convert response to audio)
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Alloy' },
                    },
                },
            },
            prompt: botResponseText,
        });

        if (!media) {
            throw new Error('No audio media returned from TTS model.');
        }

        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);
        const audioDataUri = 'data:audio/wav;base64,' + wavBase64;
        
        return {
            history: finalHistory,
            responseAudioUri: audioDataUri,
        };
    } catch (ttsError) {
        console.error("TTS generation failed:", ttsError);
        // Return text response even if TTS fails
        return {
            history: finalHistory,
        };
    }
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    
    writer.write(pcmData);
    writer.end();
  });
}
