import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [EmbeddingsService],
    exports: [EmbeddingsService], // Exported so other modules can use it
})
export class EmbeddingsModule { }
