process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { OpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionChunk, ChatCompletionTool } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";

export interface LLMProvider {
  generateEmbedding(text: string, inputType?: "query" | "passage"): Promise<number[]>;
  chatCompletion(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletion>;
  chatStream(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
  ): Promise<Stream<ChatCompletionChunk>>;
  getChatModelName(): string;
}

export class NvidiaNimProvider implements LLMProvider {
  private client: OpenAI;
  private chatModel: string;
  private embeddingModel: string;

  constructor() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || "dummy-api-key";
    const baseURL = process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
    
    this.chatModel = process.env.NIM_CHAT_MODEL || "meta/llama-3.1-70b-instruct";
    this.embeddingModel = process.env.NIM_EMBEDDING_MODEL || "nvidia/nemotron-3-embed-1b";

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async generateEmbedding(text: string, inputType: "query" | "passage" = "passage"): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
        input_type: inputType,
      } as any); // using cast since extra body params are typed specifically in OpenAI package

      if (!response.data || response.data.length === 0) {
        throw new Error("No embedding data returned from NVIDIA NIM");
      }
      return response.data[0].embedding;
    } catch (e) {
      console.error("NVIDIA NIM Embedding failure:", e);
      throw e;
    }
  }

  async chatCompletion(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      return await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        temperature: 0.2,
      });
    } catch (e) {
      console.error("NVIDIA NIM Chat Completion failure:", e);
      throw e;
    }
  }

  async chatStream(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
  ): Promise<Stream<ChatCompletionChunk>> {
    try {
      return await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        temperature: 0.2,
        stream: true,
      });
    } catch (e) {
      console.error("NVIDIA NIM Chat Stream failure:", e);
      throw e;
    }
  }

  getChatModelName(): string {
    return this.chatModel;
  }
}

export function getLLMProvider(): LLMProvider {
  return new NvidiaNimProvider();
}
