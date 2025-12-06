import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from '../embeddings/embeddings.service.js';
import { VectorStoreService } from '../vector-store/vector-store.service.js';
import OpenAI from 'openai';

@Injectable()
export class RagService {
    private openai: OpenAI;
    private readonly logger = new Logger(RagService.name);

    constructor(
        private configService: ConfigService,
        private embeddingsService: EmbeddingsService,
        private vectorStoreService: VectorStoreService,
    ) {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
            baseURL: 'https://openrouter.ai/api/v1',
        });
    }

    async answerQuestion(question: string) {
        this.logger.log(`Processing question: ${question}`);

        // 1. Embed the question
        const embedding = await this.embeddingsService.embedQuery(question);

        // 2. Search vector store for relevant chunks
        const results = await this.vectorStoreService.similaritySearch(embedding, 5);

        // 3. Construct context from results
        const context = results.map((r) => r.text).join('\n---\n');
        const sources = results.map((r) => ({
            text: (r.text || '').substring(0, 50) + '...', // Preview
            score: r.score,
            metadata: r.metadata,
        }));

        if (!context) {
            return {
                answer: "I couldn't find any relevant documents to answer your question.",
                sources: []
            };
        }

        // 4. Construct Prompt
        const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question.
If the answer is not in the context, say "I don't know based on the provided documents."
Keep your answer professional and concise.`;

        const userMessage = `Context:
${context}

Question: ${question}`;

        // 5. Call LLM (OpenRouter)
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'meta-llama/llama-3.3-70b-instruct', // Good balance of speed/quality
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
            });

            const answer = completion.choices[0]?.message?.content || 'No answer generated.';

            return {
                answer,
                sources,
                contextUsed: results.length,
            };
        } catch (error) {
            this.logger.error(`LLM generation failed: ${error.message}`);
            throw new Error('Failed to generate answer via OpenRouter');
        }
    }
}
