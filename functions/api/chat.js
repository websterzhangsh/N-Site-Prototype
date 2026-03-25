/**
 * Cloudflare Pages Function - LLM Chat API
 * Path: /api/chat
 * 
 * Supports dual mode: 2C (consumer) and 2B (dealer partner)
 * Documentation: docs/LLM_System_Prompts.md
 */

import { createLLMService } from '../lib/llm-factory.js';
import { LLM_CONFIG } from '../lib/llm-config.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { message, history, mode } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入消息' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = context.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key 未配置' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Resolve mode: '2b' for B2B dealer partners, '2c' (default) for consumers
    const chatMode = mode === '2b' ? '2b' : '2c';
    const modeConfig = LLM_CONFIG.modes[chatMode] || LLM_CONFIG.modes['2c'];
    const systemPrompt = chatMode === '2b' 
      ? LLM_CONFIG.systemPrompt2B 
      : LLM_CONFIG.systemPrompt2C;

    // Create LLM service using unified interface
    const llmService = createLLMService({
      provider: LLM_CONFIG.provider,
      apiKey: apiKey
    });

    // Build messages array with conversation history
    const messages = [];

    // Add recent history (limited by mode config)
    const maxHistory = modeConfig.historyTurns || 6;
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-maxHistory);
      for (const h of recentHistory) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call LLM via unified interface with mode-specific settings
    const response = await llmService.chat(messages, {
      systemPrompt: systemPrompt,
      temperature: modeConfig.temperature,
      maxTokens: modeConfig.maxTokens,
      topP: modeConfig.topP
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply: response.content,
        usage: response.usage,
        mode: chatMode
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Chat API Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    let userMsg = 'Server error: ' + msg;
    if (msg.includes('abort') || msg.includes('timeout')) {
      userMsg = 'Request timed out. Please try again.';
    } else if (msg.includes('network') || msg.includes('connection') || msg.includes('socket')) {
      userMsg = 'Network connection lost. Please try again.';
    }
    return new Response(
      JSON.stringify({ success: false, error: userMsg }),
      { status: 500, headers: corsHeaders }
    );
  }
}
