import { ApiProperty } from '@nestjs/swagger';

export class QueryRagDto {
    @ApiProperty({
        description: 'The question to ask about the documents',
        example: 'What is the summary of the uploaded file?',
    })
    question: string;
}
