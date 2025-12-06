import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [VectorStoreService],
    exports: [VectorStoreService], // Exported so DocumentsModule and RagModule can use it
})
export class VectorStoreModule { }
