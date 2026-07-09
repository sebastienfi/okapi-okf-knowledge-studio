import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type Provider = 'openai' | 'anthropic';

export const PROVIDERS: Provider[] = ['openai', 'anthropic'];

export const DEFAULT_MODEL: Record<Provider, string> = {
  openai: 'gpt-5.5',
  anthropic: 'claude-opus-4-8',
};

const ENV_KEY: Record<Provider, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export interface AiConfig {
  enabled: boolean;
  provider: Provider;
  model: string;
  apiKey?: string;
  /** Providers that have a key present in the environment. */
  available: Provider[];
}

/**
 * Resolve which AI provider to use from flags + environment.
 * Precedence: --provider flag > OKAPI_PROVIDER env > default (OpenAI if its key
 * is set, else Anthropic). AI is only enabled when `ai` is true AND the chosen
 * provider has a key.
 */
export function resolveAiConfig(opts: { ai: boolean; provider?: string }): AiConfig {
  const available = PROVIDERS.filter((p) => Boolean(process.env[ENV_KEY[p]]));

  const requested = (opts.provider ?? process.env.OKAPI_PROVIDER)?.toLowerCase();
  let provider: Provider;
  if (requested === 'openai' || requested === 'anthropic') {
    provider = requested;
  } else {
    provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
  }

  const apiKey = process.env[ENV_KEY[provider]];
  const model = process.env.OKAPI_MODEL ?? DEFAULT_MODEL[provider];
  return { enabled: opts.ai && Boolean(apiKey), provider, model, apiKey, available };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  system: string;
  /** Full turn history ending with the current user question. */
  messages: ChatMessage[];
  signal: AbortSignal;
}

/** Stream an answer as text deltas from the configured provider. */
export function streamChat(config: AiConfig, opts: StreamOptions): AsyncGenerator<string> {
  if (!config.apiKey) throw new Error('No API key for the selected provider');
  return config.provider === 'openai'
    ? streamOpenAI(config.apiKey, config.model, opts)
    : streamAnthropic(config.apiKey, config.model, opts);
}

async function* streamAnthropic(
  apiKey: string,
  model: string,
  { system, messages, signal }: StreamOptions,
): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({ model, max_tokens: 4096, system, messages }, { signal });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

async function* streamOpenAI(
  apiKey: string,
  model: string,
  { system, messages, signal }: StreamOptions,
): AsyncGenerator<string> {
  const client = new OpenAI({ apiKey });
  const stream = await client.chat.completions.create(
    {
      model,
      max_completion_tokens: 4096,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
    },
    { signal },
  );
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
