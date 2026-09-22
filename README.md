# Accountant System

Accountant System is a comprehensive, multi-company financial and accounting management platform designed to automate invoice processing, tax retentions, ledger reconciliations, and fiscal reporting with speed and accuracy.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Author](#author)

---

## About

Accountant System solves the operational complexities faced by accountants, businesses, and financial teams handling large volumes of fiscal documents and accounting entries. Built around multi-company isolation and domain-driven design principles, the platform integrates intelligent document ingestion, automated reconciliation, and structured ledger operations into a centralized, resilient workflow.

The core objective is to eliminate manual data entry errors, streamline third-party tax management, and provide reliable, audit-ready financial data with complete company-level segregation.

---

## Features

- **Multi-Company Data Isolation**: Strict tenant segregation ensuring all vouchers, metrics, reconciliations, and catalogs belong exclusively to the active company context.
- **Voucher &amp; Invoice Management**: Comprehensive lifecycle management for sales, purchases, and fiscal vouchers with support for diverse document classes, types, and tax concepts.
- **Intelligent Document Ingestion**: AI-assisted document parsing that extracts structured invoice, client, and tax data from digital files and images through transient processing pipelines.
- **Batch Processing &amp; Job Execution**: Background job workers supporting asynchronous document ingestion, batch parsing, and ledger persistence.
- **Third-Party &amp; Fiscal Registry**: Centralized catalog for clients and suppliers with tax identification validation and duplicate prevention.
- **Tax Retentions &amp; Conciliations**: Dynamic calculation and tracking of fiscal withholdings, retentions, and bank-to-ledger reconciliations.
- **Financial Analytics &amp; Dashboards**: Actionable metrics, period summaries, and fiscal activity visualizations for informed decision-making.
- **Export &amp; Reporting Engines**: Structured data export capabilities supporting spreadsheets, documents, and printable reports.

---

## Tech Stack

- **Framework**: Next.js (App Router, Pure REST API Architecture)
- **Frontend & UI**: React, Tailwind CSS, Radix UI primitives, Lucide Icons
- **Language**: TypeScript
- **ORM & Data Layer**: Prisma ORM
- **Database & Auth Services**: PostgreSQL with Supabase
- **AI Processing**: Google Generative AI / Gemini
- **Cache & Rate Limiting**: Redis
- **Validation**: Zod
- **Testing & Quality**: Jest, Testing Library, ESLint
- **Infrastructure & DevOps**: Docker (Multi-stage builds), Google Cloud Platform (GCP), GitHub Actions (CI/CD)
- **Package Manager**: pnpm

---

## Architecture

The project follows a Clean, Domain-Driven, Layered Architecture ensuring clear separation of concerns, high testability, and maintainability:

- **Presentation &amp; API Layer (`src/app/api/...`)**: Lightweight REST API route handlers dedicated solely to request parsing, authentication verification, service invocation, and structured HTTP responses. Server Actions are avoided in favor of explicit REST contracts.
- **Application Layer (`src/services/`)**: Use-case orchestration, business workflow management, validation coordination, and transaction boundary definitions.
- **Domain Layer (`src/models/`)**: Rich domain models encapsulating business rules, domain behaviors, invariant validation, and state mutations.
- **Infrastructure Layer (`src/repositories/`)**: Abstracted persistence layer encapsulating data-access logic and database operations to keep domain services decoupled from storage mechanisms.
- **Cross-Cutting Modules (`src/lib/`, `src/types/`)**: Centralized domain schemas, shared utilities, domain constants, and contract types organized strictly by functional responsibility.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation / API                   │
│        (Next.js App Router, Pure REST Endpoints)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Application Layer                   │
│          (Services, Workflows, Orchestration)          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      Domain Layer                      │
│            (Rich Entities & Business Rules)            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Infrastructure Layer                 │
│         (Repositories, Database Access, Cache)         │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

The repository is organized following a domain-driven file structure:

```
accountant-system/
├── prisma/               # Database schemas and migration definitions
├── public/               # Static assets and public resources
├── src/
│   ├── app/              # Next.js App Router pages, layouts, and REST API routes
│   │   ├── (auth)/       # Authentication flow routes
│   │   ├── (dashboard)/  # Main application dashboard and management views
│   │   └── api/          # Pure REST endpoint handlers organized by domain
│   ├── components/       # UI components 
│   ├── hooks/            # Custom React hooks partitioned by domain
│   ├── lib/              # Utilities, schemas, constants, and external client setups
│   │   ├── constants/    # Responsibility-scoped domain constants
│   │   ├── helpers/      # Pure domain and platform helper functions
│   │   └── schemas/      # Zod validation schemas organized by domain
│   ├── models/           # Rich domain entities and core business logic
│   ├── repositories/     # Data access layer and persistence abstractions
│   ├── services/         # Application and domain orchestration services
│   ├── types/            # TypeScript type definitions and API contracts
│   └── __tests__/        # Automated unit and integration test suites
└── package.json          # Project dependencies, scripts, and package metadata
```

---

## Author

- **Julian Ibarra** ([@Jule1097](https://github.com/Jule1097))

