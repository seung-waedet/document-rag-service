import { Module } from '@nestjs/common';
import { RagService } from './rag.service.js';
import { RagController } from './rag.controller.js';
import { EmbeddingsModule } from '../embeddings/embeddings.module.js';
import { VectorStoreModule } from '../vector-store/vector-store.module.js';

@Module({
    imports: [EmbeddingsModule, VectorStoreModule], // RAG needs both embeddings and vector store
    controllers: [RagController],
    providers: [RagService],
})
export class RagModule { }
