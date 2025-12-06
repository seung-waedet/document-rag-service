import { Controller, Post, Body } from '@nestjs/common';
import { RagService } from './rag.service.js';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { QueryRagDto } from './dto/query-rag.dto.js';
import { RagResponseDto } from './dto/rag-response.dto.js';
import { ApiResponse } from '@nestjs/swagger';

@ApiTags('rag')
@Controller('rag')
export class RagController {
    constructor(private readonly ragService: RagService) { }

    @Post('query')
    @ApiOperation({ summary: 'Ask a question about the uploaded documents' })
    @ApiBody({ type: QueryRagDto })
    @ApiResponse({
        status: 201, // Post requests return 201 by default
        description: 'The answer to the question based on the document context',
        type: RagResponseDto,
    })
    async query(@Body() dto: QueryRagDto) {
        return this.ragService.answerQuestion(dto.question);
    }
}
