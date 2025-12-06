import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';

export interface VectorDocument {
    id: string;
    text: string;
    metadata: Record<string, any>;
    embedding?: number[];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private client: ChromaClient;
    private collection: Collection;
    private readonly logger = new Logger(VectorStoreService.name);
    private readonly collectionName = 'rag-documents';

    constructor(private configService: ConfigService) {
        const chromaPath = this.configService.get<string>('CHROMA_PATH') || 'http://localhost:8000';
        this.client = new ChromaClient({
            path: chromaPath,
        });
    }

    async onModuleInit() {
        await this.ensureCollection();
    }

    private async ensureCollection() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
            });
            this.logger.log(`Allowed collection access: ${this.collectionName}`);
        } catch (error) {
            this.logger.error(`Failed to connect to ChromaDB: ${error.message}`);
            // Don't throw here to avoid crashing app on startup if Chroma isn't ready,
            // but methods will fail.
        }
    }

    async addDocuments(documents: VectorDocument[]) {
        if (!this.collection) await this.ensureCollection();

        const ids = documents.map((doc) => doc.id);
        const embeddings = documents.map((doc) => doc.embedding!);
        const metadatas = documents.map((doc) => doc.metadata);
        const texts = documents.map((doc) => doc.text);

        if (ids.length === 0) return;

        try {
            await this.collection.add({
                ids,
                embeddings,
                metadatas,
                documents: texts,
            });
            this.logger.log(`Added ${documents.length} documents to vector store`);
        } catch (error) {
            this.logger.error(`Error adding documents to Chroma: ${error.message}`);
            throw error;
        }
    }

    async similaritySearch(embedding: number[], k: number = 5) {
        if (!this.collection) await this.ensureCollection();

        try {
            const results = await this.collection.query({
                queryEmbeddings: [embedding],
                nResults: k,
            });

            if (!results.ids || results.ids.length === 0) {
                return [];
            }

            // Chroma returns arrays of arrays (batch query support)
            // We only queried for one embedding
            const ids = results.ids[0];
            const metadatas = results.metadatas[0];
            const documents = results.documents[0];
            const distances = results.distances ? results.distances[0] : [];

            return ids.map((id, index) => ({
                id,
                metadata: metadatas[index],
                text: documents[index],
                score: distances[index], // Distance score (lower is better usually for L2, depends on metric)
            }));
        } catch (error) {
            this.logger.error(`Error searching vector store: ${error.message}`);
            throw error;
        }
    }
}
