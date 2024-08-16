# Data Stack Architecture - WIP

# Data Access Gateway

## Overview

The Data Access Gateway serves as the entry point for external interactions with the Autonomys Network's data access layer PoC. It provides a basic interface for uploading and retrieving data stored on the network's Distributed Storage Network (DSN).

## Objectives

- Demonstrate basic data upload and retrieval functionality
- Provide a simple, secure entry point for data operations
- Route requests to appropriate internal services

## Architecture

### **Core** Components

1. Request Handler
2. Basic Authentication Module (optional for PoC)
3. Request Router

## Component Details

### 1. Request Handler

- Accepts incoming HTTP requests
- Performs basic request validation

### 2. Basic Authentication Module

- Verifies user credentials using a simple API key mechanism

### 3. Request Router

- Routes requests to the appropriate internal service (Upload or Retrieval)

## Key Processes

### Data Upload Process

1. Receive upload request
2. Authenticate user (API key)
3. Basic validation (file size, format)
4. Route to Data Upload Service
5. Return upload status to client
    1. Track status of upload through process
        1. Metadata and file chunking info
        2. Upload transactions
        3. Data archived

### Data Retrieval Process

1. Receive retrieval request
2. Route to Data Retrieval Service
3. Return data to client

## Future Considerations

- Caching
- Load balancing

# Data Chunking and Metadata Manager Service

## Overview

This service handles the chunking of large data sets and manages associated metadata. It generates CIDs for the primary data only, simplifying data management and blockchain interactions.

## Core Components

1. Data Chunker
2. CID Generator
3. Metadata Manager
4. Chunk Tracker
5. Data Reassembler

## Component Details

### 1. Data Chunker

- Breaks data larger than 1 MB into smaller chunks
- Ensures each chunk is within the block size limit

### 2. CID Generator

- Generates a CID for the entire data set based on its content
- Generates CIDs for individual chunks

### 3. Metadata Manager

- Creates and manages metadata for each data set, including:
    - Data CID
    - Total size
    - Number of chunks
    - List of chunk CIDs and their order
    - Custom metadata (if any)

### 4. Chunk Tracker

- Maintains a record of all chunks for each data set
- Tracks the storage location of each chunk in the DSN

### 5. Data Reassembler

- Retrieves chunks based on metadata
- Reassembles the data in the correct order

## Data Structures

### Data Metadata

```json
{
  "dataCid": "content_identifier_of_entire_dataset",
  "dataType": "file",  // or "raw"
  "name": "example.pdf",  // optional, for files
  "mimeType": "application/pdf", 
  "totalSize": 15000000,
  "totalChunks": 4,
  "chunks": [
    {
      "cid": "content_identifier_of_chunk_1",
      "order": 1,
      "size": 4000000,
      "dsnLocation": 
	    {
		    "pieceIndex": 1,
		    "offset": 20
      }
    },
    // ... other chunks ...
  ],
  "customMetadata": {
    // Any additional user-defined metadata
  }
}

```

## Key Processes

### Data Upload Process

1. Receive data from Data Upload Service
2. If data > 1MB, chunk the data
3. Generate CID for the entire data set
4. Generate CIDs for each chunk
5. Create metadata
6. Pass chunks and their CIDs to Blockchain Transaction Manager for storage
7. Store metadata off-chain
8. Return data CID to Data Upload Service

### Data Retrieval Process

1. Receive data retrieval request (CID) from Data Retrieval Service
2. Fetch metadata using the CID
3. Request chunks from Blockchain Transaction Manager
4. Reassemble data from chunks
5. Verify reassembled data integrity using the original CID
6. Return complete data set to Data Retrieval Service

## Interfaces

### With Blockchain Transaction Manager

- Send: Chunks and their CIDs for storage
- Receive: Confirmation of chunk storage

### With Off-Chain Storage (for metadata)

- Store and retrieve metadata using data CID as key

# Transaction Manager Service

## Overview

The Transaction Manager Service is responsible for interfacing with the Autonomys Network blockchain via RPC calls. It manages all transactions necessary to store data on-chain, including handling the upload of data chunks and maintaining associated metadata.

## Objectives

- Manage blockchain interactions for data storage
- Handle transaction creation, submission, and monitoring
- Ensure data integrity during the on-chain storage process
- Provide status updates on ongoing transactions
- Handle transaction failures and retries

## Core Components

1. RPC Client
2. Transaction Builder
3. Transaction Submitter
4. Transaction Monitor
5. Error Handler

## Component Details

### 1. RPC Client

- Establishes and maintains connection with the blockchain
- Implements methods for various RPC calls required for data storage

### 2. Transaction Builder

- Constructs blockchain transactions for data chunk uploads
- Ensures transactions adhere to blockchain protocol requirements

### 3. Transaction Submitter

- Submits built transactions to the blockchain
- Manages transaction queues to prevent overwhelming the network
- Implements rate limiting and backoff strategies

### 4. Transaction Monitor

- Tracks the status of submitted transactions
- Provides real-time updates on transaction progress
- Confirms successful inclusion of transactions in blocks

### 5. Error Handler

- Manages transaction failures and exceptions
- Implements retry logic for failed transactions
- Provides detailed error reporting

## Key Processes

### Data Chunk Upload Process

1. Receive data chunk and metadata from Data Chunking Service
2. Construct transaction(s) for the data chunk
3. Submit transaction(s) to the blockchain
4. Monitor transaction status
5. Confirm successful on-chain storage
6. Return transaction status and on-chain location to Data Chunking Service

### Transaction Status Checking

1. Receive status check request for a specific transaction
2. Query blockchain for transaction status
3. Return detailed status information

## Interfaces

### Input

- Data chunks for upload
- Metadata for data chunks
- Transaction status check requests

### Output

- Transaction submission status
- On-chain storage location for data chunks
- Detailed transaction status reports

## Error Handling

- Implement exponential backoff for failed transactions

## Security Considerations

- Implement rate limiting to prevent DoS attacks
- Ensure data integrity checks before and after blockchain storage

## Future Considerations

- Implementation of transaction batching for improved efficiency
- Integration with a blockchain explorer for enhanced transaction tracking