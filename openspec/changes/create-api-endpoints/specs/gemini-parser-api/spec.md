## Purpose

Exposes an endpoint to extract structured invoice data from PDF/image files in-memory using the Gemini API, returning JSON data for manual review.

## ADDED Requirements

### Requirement: Document Upload and In-Memory Execution
The parser endpoint `/api/vouchers/parse` MUST accept document uploads (PDF, PNG, JPEG) via multipart/form-data. It MUST process the files entirely in-memory using buffers without saving files to disk or remote buckets. The system MUST reject any uploaded file that exceeds 2MB in size before processing or executing any AI requests.

#### Scenario: PDF invoice upload
- **WHEN** a client uploads a PDF invoice under 2MB to the parse endpoint
- **THEN** the system MUST read the file stream into memory and process it directly

#### Scenario: Upload exceeding file size limit
- **WHEN** a client uploads a file larger than 2MB
- **THEN** the system MUST reject the request immediately with a 400 Bad Request status code and a Spanish error message, without sending data to the AI model

### Requirement: Gemini AI Parsing and Structured Extraction
The system MUST send the file buffer to the Gemini API with a prompt requesting structured invoice fields, parsing the response to JSON. If a CUIT is successfully extracted, the system MUST perform a database lookup to check if a client/supplier with that CUIT is already registered in the system. If found, it MUST return their ID (UUID) in the response.

#### Scenario: Successful AI extraction with existing contact
- **WHEN** Gemini successfully identifies invoice fields including a CUIT that exists in the database
- **THEN** the system MUST return the extracted fields and the contact's UUID in the success payload

#### Scenario: Successful AI extraction with non-existing contact
- **WHEN** Gemini successfully identifies invoice fields including a CUIT that does not exist in the database
- **THEN** the system MUST return the extracted fields and set the contact UUID to null in the success payload

### Requirement: Extraction Fallback for Missing Fields
If the Gemini model fails to extract any specific field(s) from the document, the endpoint MUST set those non-detected fields to null in the response payload, allowing the user to complete them manually.

#### Scenario: Incomplete extraction of fields
- **WHEN** Gemini fails to detect one or more fields (such as point of sale, number, or CUIT)
- **THEN** the system MUST return the response containing the successfully extracted fields and return any missing fields as null
