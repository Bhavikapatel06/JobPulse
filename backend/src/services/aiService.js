/**
 * ─────────────────────────────────────────────────────────────
 *  AI Service – Unified interface for multiple LLM providers
 * ─────────────────────────────────────────────────────────────
 *
 *  Supported providers (set AI_PROVIDER in .env):
 *    • groq     – Groq Cloud (default/recommended - fast & free tier)
 *    • gemini   – Google Gemini
 *    • openai   – OpenAI GPT (requires: npm install openai)
 *    • anthropic – Anthropic Claude (requires: npm install @anthropic-ai/sdk)
 *
 *  All providers expose the same public interface:
 *    aiService.generateText(prompt: string) → Promise<string>
 */

const logger = require('../config/logger');

class AIService {
  constructor() {
    this.provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
    logger.info(`[AIService] Provider: ${this.provider}`);
  }

  /**
   * Generate a text response from the configured LLM provider.
   * @param {string} prompt  – The input prompt
   * @returns {Promise<string>} – Plain-text LLM response
   */
  async generateText(prompt) {
    switch (this.provider) {
      case 'groq':
        return this._groq(prompt);
      case 'gemini':
        return this._gemini(prompt);
      case 'openai':
        return this._openai(prompt);
      case 'anthropic':
        return this._anthropic(prompt);
      default:
        logger.warn(`[AIService] Unknown provider "${this.provider}", falling back to groq`);
        return this._groq(prompt);
    }
  }

  // ─── Groq Cloud ───────────────────────────────────────────────

  async _groq(prompt) {
    const axios = require('axios');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is not set in .env');
    }

    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const MAX_RETRIES = 4;

    const makeRequest = async (attempt = 0) => {
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const text = response.data?.choices?.[0]?.message?.content || '';
        logger.debug(`[AIService][Groq] Response length: ${text.length} chars`);
        return text;

      } catch (err) {
        const status = err.response?.status;
        const isRateLimit = status === 429 || err.message?.includes('Rate limit');

        if (isRateLimit && attempt < MAX_RETRIES) {
          // Respect Retry-After header if present, else use exponential backoff
          const retryAfterSec = parseInt(err.response?.headers?.['retry-after'] || '0', 10);
          const backoffMs = retryAfterSec > 0
            ? retryAfterSec * 1000
            : Math.min(2000 * Math.pow(2, attempt), 30000); // 2s → 4s → 8s → 16s → 30s cap

          logger.warn(
            `[AIService][Groq] Rate limit (429). Retry ${attempt + 1}/${MAX_RETRIES} ` +
            `in ${Math.round(backoffMs / 1000)}s...`
          );
          await new Promise((r) => setTimeout(r, backoffMs));
          return makeRequest(attempt + 1);
        }

        const errMsg = err.response?.data?.error?.message || err.message;
        logger.error(`[AIService][Groq] Error: ${errMsg}`);
        throw new Error(`Groq API Error: ${errMsg}`);
      }
    };

    return makeRequest();
  }

  // ─── Google Gemini ────────────────────────────────────────────

  async _gemini(prompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not set in .env');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    logger.debug(`[AIService][Gemini] Response length: ${text.length} chars`);
    return text;
  }

  // ─── OpenAI ──────────────────────────────────────────────────

  async _openai(prompt) {
    /*
     *  To enable OpenAI:
     *    1.  npm install openai
     *    2.  Set AI_PROVIDER=openai in .env
     *    3.  Set OPENAI_API_KEY=sk-... in .env
     *    4.  Optionally set OPENAI_MODEL (default: gpt-4o-mini)
     */
    let OpenAI;
    try {
      ({ OpenAI } = require('openai'));
    } catch {
      throw new Error(
        'OpenAI package not installed. Run: npm install openai'
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || '';
    logger.debug(`[AIService][OpenAI] Response length: ${text.length} chars`);
    return text;
  }

  // ─── Anthropic Claude ────────────────────────────────────────

  async _anthropic(prompt) {
    /*
     *  To enable Anthropic:
     *    1.  npm install @anthropic-ai/sdk
     *    2.  Set AI_PROVIDER=anthropic in .env
     *    3.  Set ANTHROPIC_API_KEY in .env
     *    4.  Optionally set ANTHROPIC_MODEL (default: claude-3-haiku-20240307)
     */
    let Anthropic;
    try {
      ({ default: Anthropic } = require('@anthropic-ai/sdk'));
    } catch {
      throw new Error(
        'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk'
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0]?.text || '';
    logger.debug(`[AIService][Anthropic] Response length: ${text.length} chars`);
    return text;
  }
}

// Export a singleton so provider initialisation happens once
module.exports = new AIService();
