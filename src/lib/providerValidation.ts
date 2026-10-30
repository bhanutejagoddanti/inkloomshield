import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { LiveProviderError } from './auditEngine';

export type ProviderId = 'gemini' | 'anthropic';

export async function validateProviderKey(apiKey: string, provider: ProviderId): Promise<{ valid: boolean; message: string }> {
  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: 'Reply with the single word: OK',
        config: { responseMimeType: 'text/plain', temperature: 0 },
      });
      if (!result.text) throw new Error('Empty provider response');
      return { valid: true, message: 'Connected to Gemini successfully.' };
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      max_tokens: 8,
      messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
    });
    const block = response.content.find((item) => item.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Empty provider response');
    return { valid: true, message: 'Connected to Claude successfully.' };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unknown provider error';
    const status = /api key|unauthori[sz]ed|authentication|permission|401|403/i.test(rawMessage) ? 401 : 502;
    throw new LiveProviderError(
      status === 401
        ? 'The provider rejected this API key. The key may be invalid, expired, or missing required permissions.'
        : 'The provider could not complete a connection test. Try again in a moment.',
      status,
    );
  }
}
