import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import { Express } from 'express';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

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
  ) { }

  async processDocument(file: Express.Multer.File) {
    // Create a document record with processing status
    const document = new Document();
    document.originalName = file.originalname;
    document.status = DocumentStatus.PROCESSING;
    const savedDocument = await this.documentsRepository.save(document);

    try {
      // Extract text based on file type
      let textContent: string;

      switch (file.mimetype) {
        case 'application/pdf':
          const pdfData = await pdfParse(file.buffer);
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

      // For now, just save the document as ready with chunk count
      // Later, we'll store embeddings in vector DB
      savedDocument.status = DocumentStatus.READY;
      savedDocument.chunkCount = chunks.length;
      await this.documentsRepository.save(savedDocument);

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
