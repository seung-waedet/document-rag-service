import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import * as pdfParseLib from 'pdf-parse';
import * as mammoth from 'mammoth';
import { Express } from 'express';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { EmbeddingsService } from '../embeddings/embeddings.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentChunk {
  text: string;
  documentId: string;
  chunkIndex: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private embeddingsService: EmbeddingsService,
    private vectorStoreService: VectorStoreService,
  ) { }

  async processDocument(file: Express.Multer.File) {
    // Create a document record with processing status
    const document = new Document();
    document.originalName = file.originalname;
    document.status = DocumentStatus.PROCESSING;
    let savedDocument = await this.documentsRepository.save(document);

    try {
      // Extract text based on file type
      let textContent: string;

      switch (file.mimetype) {
        case 'application/pdf':
          const { PDFParse } = pdfParseLib as any;
          const parser = new PDFParse({ data: file.buffer });
          const pdfData = await parser.getText();
          textContent = pdfData.text;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
          const docxResult = await mammoth.extractRawText({
            buffer: file.buffer,
          });
          textContent = docxResult.value;
          break;

        case 'text/plain':
          textContent = file.buffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      // Chunk the text content
      const chunks = await this.chunkText(textContent, savedDocument.id);

      // Embed chunks
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await this.embeddingsService.embedDocuments(chunkTexts);

      // Store in Vector DB
      await this.vectorStoreService.addDocuments(
        chunks.map((chunk, index) => ({
          id: uuidv4(), // Unique ID for the chunk in Vector DB
          text: chunk.text,
          metadata: {
            documentId: savedDocument.id,
            chunkIndex: index,
            originalName: savedDocument.originalName,
          },
          embedding: embeddings[index],
        })),
      );

      // Save the document as ready with chunk count
      savedDocument.status = DocumentStatus.READY;
      savedDocument.chunkCount = chunks.length;
      savedDocument = await this.documentsRepository.save(savedDocument);

      return {
        id: savedDocument.id,
        message: 'Document processed successfully',
        status: savedDocument.status,
        chunkCount: chunks.length,
      };
    } catch (error) {
      // Update document status to failed if processing fails
      savedDocument.status = DocumentStatus.FAILED;
      await this.documentsRepository.save(savedDocument);

      throw error;
    }
  }

  private async chunkText(
    text: string,
    documentId: string,
  ): Promise<DocumentChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // ~400-600 tokens
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const splitText = await splitter.splitText(text);

    const chunks: DocumentChunk[] = splitText.map((chunk, index) => ({
      text: chunk,
      documentId,
      chunkIndex: index,
    }));

    return chunks;
  }

  async findOne(id: string) {
    return this.documentsRepository.findOneBy({ id });
  }

  async findAll() {
    return this.documentsRepository.find({
      order: { uploadedAt: 'DESC' },
    });
  }
}
