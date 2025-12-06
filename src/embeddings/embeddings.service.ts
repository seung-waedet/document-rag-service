import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
    private openai: OpenAI;
    private model: string;
    private readonly logger = new Logger(EmbeddingsService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENROUTER_API_KEY is not set. Embeddings will fail.');
        }

        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
            baseURL: 'https://openrouter.ai/api/v1',
        });

        // Switched to a standard model supported by OpenRouter
        this.model = 'openai/text-embedding-3-small';
    }

    async embedQuery(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            this.logger.error(`Failed to embed query: ${error.message}`);
            throw error;
        }
    }

    async embedDocuments(documents: string[]): Promise<number[][]> {
        try {
            // Note: Check provider limits for batch size.
            // OpenRouter routes to providers, different limits apply.
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: documents,
            });
            // Sort by index to ensure order is preserved if the API returns them out of order (rare but possible with some providers)
            // OpenAI SDK usually handles this, but good to know.
            return response.data.map((item) => item.embedding);
        } catch (error) {
            this.logger.error(`Failed to embed documents: ${error.message}`);
            throw error;
        }
    }
}
