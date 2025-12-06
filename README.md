# Document RAG Service

A NestJS-based API service for performing Retrieval-Augmented Generation (RAG) on uploaded documents. This service allows users to upload documents (PDF, DOCX, TXT), chunks and embeds them into a vector database, and perform semantic search to answer questions based on the document's context.

## Key Features

*   **Document Processing**: Seamlessly upload and process PDF, DOCX, and TXT files.
*   **Vector Search**: Uses ChromaDB for efficient storage and retrieval of vector embeddings.
*   **RAG Architecture**: Retrieves relevant context to generate accurate answers using LLMs (via OpenRouter/OpenAI).
*   **Swagger Documentation**: Fully documented API endpoints available at `/api`.

## Technology Stack

1.  **ChromaDB**: An open-source vector database used to store high-dimensional embeddings of document chunks, enabling efficient semantic similarity search.
2.  **LangChain (Text Splitters)**: Provides the `RecursiveCharacterTextSplitter` algorithm to intelligently break down large documents into manageable chunks while preserving context.
3.  **OpenAI SDK**: Used as a unified client to connect with OpenRouter's API, facilitating access to various LLM providers (like Meta Llama 3) for embeddings and chat completions.
4.  **Mammoth**: A specialized library for converting `.docx` files into raw text by targeting the underlying XML structure, ensuring high-quality text extraction.
5.  **PDF-Parse**: A lightweight library for extracting raw text content from PDF files, serving as a critical preprocessing step for the RAG pipeline.

## Prerequisites
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [Docker](https://www.docker.com/) (for running ChromaDB)

## Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd document-rag-service
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory (based on `.env.example` if available) and add your keys:
    ```env
    OPENROUTER_API_KEY=your_api_key_here
    # Optional overrides
    # PORT=3000
    # CHROMA_PATH=http://localhost:8000
    ```

4.  **Start Services**:
    Start the local vector database using Docker Compose:
    ```bash
    docker-compose up -d
    ```

5.  **Run the Application**:
    ```bash
    # development
    npm run start

    # watch mode
    npm run start:dev
    ```

## API Documentation

The API includes Swagger documentation for interactive exploration.

*   **URL**: `http://localhost:3000/api`

### Example Usage

**1. Upload a Document**
```bash
curl -X POST 'http://localhost:3000/documents/upload' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/document.pdf'
```

**2. Ask a Question**
```bash
curl -X POST 'http://localhost:3000/rag/query' \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "What is the summary of this document?"
  }'
```

## License

This project is [UNLICENSED](LICENSE).
