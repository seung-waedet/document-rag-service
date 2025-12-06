import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity()
export class Document {
  @ApiProperty({ description: 'The unique identifier of the document', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The original name of the uploaded file', example: 'report.pdf' })
  @Column()
  originalName: string;

  @ApiProperty({ description: 'The path where the file is stored', required: false })
  @Column({ nullable: true })
  filePath?: string;

  @ApiProperty({ description: 'The date and time when the document was uploaded' })
  @CreateDateColumn()
  uploadedAt: Date;

  @ApiProperty({ description: 'The number of chunks created from this document', example: 42 })
  @Column({ default: 0 })
  chunkCount: number;

  @ApiProperty({ description: 'The processing status of the document', enum: DocumentStatus, example: DocumentStatus.READY })
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PROCESSING,
  })
  status: DocumentStatus;
}
