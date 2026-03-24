# Data + AI Strategy for Nestopia

**Version:** 3.1  
**Last Updated:** 2026-03-13  
**Status:** Active Development — LLM-First Approach

---

## Executive Summary

This document outlines the comprehensive data and AI strategy for Nestopia's outdoor living customization platform. It covers data architecture, AI agent implementation, knowledge management, and the integration of private domain data for RAG (Retrieval-Augmented Generation), embeddings, and fine-tuning purposes. The platform is powered by **five AI Agents**: AI Designer, Pricing & Cost Controller, Compliance Manager, Customer Service Executive, and **Knowledge Base Builder** — coordinated through a **Chatbot unified conversation entry point** (✅ MVP UI complete, 2026-03-24).

**Strategic Pivot (v3.1)**: Following industry insights from Anthropic and modern LLM capabilities, we adopt a **LLM-First, Fine-Tuning Later** approach:
- **Short-term (0-6 months)**: Depend on public LLM APIs (GPT-4, Claude, Qwen) with prompt engineering
- **Mid-term (6-12 months)**: Light RAG with 10-50 curated documents, continuous strategy assessment
- **Long-term (12+ months)**: Selective fine-tuning only after product-market fit and data accumulation

---

## 1. Data Landscape Overview

### 1.1 Typical Business Data

| Data Category | Examples | Format | Source |
|--------------|----------|--------|--------|
| **Product Info** | SKUs, specifications, pricing, materials | Structured (JSONB/Relational) | ERP/Master Data |
| **Customer Info** | Contact, preferences, site information | Structured (Relational) | CRM/Intake Forms |
| **Customer Success** | Videos, renderings, testimonials | Unstructured (Media) | Project Deliverables |
| **Site Information** | Photos, measurements, surveys | Mixed (Image + Structured) | Field Collection |
| **Orders & Payments** | Transactions, contracts, invoices | Structured (Relational) | ERP/Financial System |
| **Design Documents** | CAD files, blueprints, calculations | Unstructured (CAD/Binary) | Design Software |
| **Permits & Certifications** | Regulatory approvals, compliance docs | Unstructured (PDF) | Government/Third-party |
| **Assembly Instructions** | Manuals, videos, guides | Unstructured (PDF/Video) | Internal Documentation |

### 1.2 Data by Collection Method

#### Manual (Human-driven)
| Use Case | Data Format | Collection Method |
|----------|-------------|-------------------|
| Site Information | Image + Structured | Manual measurement, photography, review |
| Image Data | Image | Relationship-based tables (dimensions) |

#### Smart (AI/Auto-driven)
| Use Case | Capability | Data Format | Output |
|----------|------------|-------------|--------|
| AI Design | Photo-realistic image generation | Image, Text | Renderings |
| Precision Measurement | Point cloud extraction | CAD file | Accurate dimensions |
| Design Software | Auto-generated drawings | CAD file | Plans, layouts, specs |
| ERP Integration | Order-to-Cash | Master Data + Transaction Data | Orders, Payments, Contracts |
| AI Insights | Analytics & RAG | Structured + Text/Blob | Knowledge Base, Chatbot |
| Project Management | Scope, milestone, risk | OA Database/Files | Project tracking |

---

## 2. Knowledge Base Architecture (NEW)

### 2.1 Purpose

The Knowledge Base serves as a **private domain data repository** that feeds our 4 AI Agents with company-specific, non-public information. This supplements:
- Public domain information (industry standards, general knowledge)
- Structured business data (ERP/CRM transactions)

**Key Functions:**
- RAG (Retrieval-Augmented Generation) for contextual responses
- Embedding storage for semantic search
- Fine-tuning data preparation for domain-specific model training

### 2.2 Document Categories

| Category | Purpose | Target AI Agents | Example Documents |
|----------|---------|------------------|-------------------|
| **Installation & Technical** | Engineering specs, procedures | AI Designer, Customer Service | Installation manuals, structural calculations, material specs |
| **Compliance & Regulatory** | Building codes, permits, HOA | Compliance Manager | CA Title 24, FL wind zones, FEMA maps, permit templates |
| **Sales & Marketing** | Pricing, competitive intel, pitches | Pricing Agent, Customer Service | Competitor analysis, sales scripts, territory mapping |
| **Training Materials** | Onboarding, SOPs, guides | All Agents | Employee handbooks, QC procedures, troubleshooting guides |
| **After-Sales & Warranty** | Support, maintenance, claims | Customer Service | Warranty policies, maintenance schedules, claim SOPs |
| **Design References** | Style guides, portfolios, standards | AI Designer | Color palettes, photography standards, project portfolios |

### 2.3 Knowledge Base UI Features

```
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Base                                    [Upload] │
├─────────────────────────────────────────────────────────────┤
│  Stats: 47 docs | 39 Indexed | 5 Processing | 6 Categories  │
├─────────────────────────────────────────────────────────────┤
│  [All] [Installation] [Compliance] [Sales] [Training] ...   │
├─────────────────────────────────────────────────────────────┤
│  Search: _________________  Sort: [Newest ▼] Status: [All ▼]│
├─────────────────────────────────────────────────────────────┤
│  Document          Category      Tags      Agents    Status │
│  ─────────────────────────────────────────────────────────  │
│  📄 Pergola Install  Installation  pergola   🤖 🤖   ✅     │
│     Manual v3.2              installation service Indexed   │
│  📄 CA Building Code Compliance    CA, code  🤖      ✅     │
│     2026.pdf                 pergola      Compliance        │
│  📄 Sales Pitch Deck Sales       pergola   🤖 🤖     ✅     │
│     Residential.pptx         sales       service            │
└─────────────────────────────────────────────────────────────┘
```

**Upload Workflow:**
1. Drag & drop files (PDF, DOC, XLS, images, video)
2. Select category
3. Tag with keywords (auto-suggested: pergola, sunroom, zip blinds, ADU, CA, FL, HOA)
4. Assign to AI Agent(s) (Designer, Pricing, Compliance, Service)
5. Add description (optional)
6. Upload → Auto-indexing → Available for RAG

### 2.4 Tagging Strategy

**Product Tags:**
- `pergola`, `sunroom`, `zip-blinds`, `ADU`

**Geographic Tags:**
- `california`, `florida`, `texas`, `new-york`
- Region-specific for compliance and pricing

**Use Case Tags:**
- `installation`, `maintenance`, `warranty`, `permit`, `HOA`
- `residential`, `commercial`, `pool-enclosure`

**Process Tags:**
- `SOP`, `checklist`, `template`, `training`, `reference`

---

## 3. AI Agent Data Requirements

### 3.1 AI Designer Agent

**Input Data Needs:**
| Data Type | Source | Purpose |
|-----------|--------|---------|
| Site photos | Customer upload/Measurement team | Context for scene fusion |
| CAD files | Design software | Structural integration |
| Material catalogs | Supplier APIs/Product DB | Realistic material rendering |
| Style guides | Knowledge Base | Brand-consistent design |
| Project portfolios | Knowledge Base | Similar project recommendations |

**Output:**
- Photo-realistic renderings
- Design variations
- Material recommendations
- Structural feasibility checks

### 3.2 Pricing & Cost Controller Agent

**Input Data Needs:**
| Data Type | Source | Purpose |
|-----------|--------|---------|
| Material costs | Supplier APIs/Knowledge Base | Real-time pricing |
| Labor benchmarks | Knowledge Base | Regional cost estimation |
| Historical quotes | ERP transaction data | Win-rate analysis |
| Competitor pricing | Knowledge Base | Market positioning |
| Regional factors | Knowledge Base | Location-based adjustments |

**Output:**
- 3-tier quotes (Basic/Standard/Premium)
- Profit margin analysis
- Cost optimization suggestions
- Dynamic pricing recommendations

### 3.3 Compliance Manager Agent

**Input Data Needs:**
| Data Type | Source | Purpose |
|-----------|--------|---------|
| Building codes | Knowledge Base | Regulatory compliance |
| HOA guidelines | Knowledge Base | Community approval |
| Permit templates | Knowledge Base | Application automation |
| Case law | Knowledge Base | Risk assessment |
| FEMA/seismic maps | Knowledge Base | Natural hazard compliance |

**Output:**
- Permit requirement checklists
- Compliance risk reports
- HOA submission packages
- Regulatory change alerts

### 3.4 Customer Service Executive Agent

**Input Data Needs:**
| Data Type | Source | Purpose |
|-----------|--------|---------|
| FAQ library | Knowledge Base | Instant answers |
| Product manuals | Knowledge Base | Technical support |
| Warranty policies | Knowledge Base | Claim processing |
| Customer history | CRM/ERP | Personalized service |
| Troubleshooting guides | Knowledge Base | Problem resolution |

**Output:**
- Contextual responses
- Proactive recommendations
- Escalation alerts
- Sentiment analysis

### 3.5 Knowledge Base Builder Agent

**Core Role:** The intelligence foundation layer — ingests, organizes, and maintains all private domain knowledge that powers the other four agents.

**Input Data Needs:**
| Data Type | Source | Purpose |
|-----------|--------|---------|
| PDFs / DOCX / PPTX | Manual upload | Structured knowledge ingestion |
| Images | Manual upload | OCR extraction + visual reference |
| Videos | Manual upload | Transcript extraction + indexing |
| Spreadsheets (XLSX) | Manual upload | Tabular data (pricing, specs, schedules) |

**Processing Pipeline:**
1. Upload → Auto-detect file type
2. Extract text/content (OCR for images, transcription for video)
3. Chunk into semantic segments
4. Generate vector embeddings
5. Index into vector DB (pgvector)
6. Tag with category + agent routing metadata
7. Status → **Indexed** (queryable by all assigned agents)

**6-Category Organization:**
| Category | Feeds Agents |
|----------|-------------|
| Installation & Technical | AI Designer, Compliance Manager |
| Compliance & Regulatory | Compliance Manager |
| Sales & Marketing | Pricing Controller, CS Executive |
| Design References | AI Designer |
| Training & Onboarding | CS Executive |
| After-Sales & Warranty | CS Executive |

**Output:**
- Fully indexed, semantically searchable knowledge base
- Agent-specific knowledge routing
- Document version tracking and status monitoring
- Gap analysis reports (what knowledge is missing)

---

## 4. Data Architecture

### 4.1 Lakehouse Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENT EXECUTION LAYER                 │
│  (Designer | Pricing | Compliance | Customer Service | KB Builder) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA SERVICE LAYER                       │
│  • API Gateway        • Vector Search      • SQL Query      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PROCESSING LAYER (ELT + AI)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  ELT Pipeline│  │  Metadata   │  │  Vector Embedding   │  │
│  │  (dbt/Spark)│  │  Extraction │  │  (RAG/Fine-tuning)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAKE STORAGE LAYER                       │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │  Object Store│ │  Vector DB   │ │  Structured Store   │  │
│  │  (S3/R2)     │ │  (pgvector)  │ │  (PostgreSQL)       │  │
│  │              │ │              │ │                     │  │
│  │  • Images    │ │  • Text      │ │  • ERP data         │  │
│  │  • CAD files │ │    embeddings│ │  • Orders           │  │
│  │  • Videos    │ │  • Image     │ │  • Customers        │  │
│  │  • PDFs      │ │    vectors   │ │  • Products         │  │
│  └──────────────┘ └──────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCE LAYER                        │
│  ERP │ OA │ Design Software │ Measurement Tools │ Knowledge │
│      │    │                 │                   │   Base    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

1. **Ingestion:** Raw data from all sources → Lake Storage
2. **Processing:** 
   - Structured data: ELT pipeline (cleaning, modeling)
   - Unstructured data: Metadata extraction + Vector embedding
3. **Serving:** Unified API for AI Agents
4. **Consumption:** RAG queries, fine-tuning datasets, analytics

### 4.3 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Lakehouse over Data Warehouse** | Supports multi-modal data (images, CAD, video) natively |
| **ELT over ETL** | Flexibility to transform after loading; AI-enhanced transformations |
| **Vector Database** | Essential for RAG and semantic search across documents |
| **Local/Private Deployment** | Data privacy for CAD designs, customer contracts, proprietary knowledge |
| **Unified ID System** | Connect project IDs across ERP, CAD, Knowledge Base, and CRM |

---

## 5. Implementation Roadmap (Timeline-Based)

### Phase 0: Foundation (Months 0-3) ✅
**Status**: Core infrastructure complete

- [x] Multi-tenant database schema (Supabase)
- [x] Test data creation (seed_data.sql with 47 realistic documents)
- [x] Knowledge Base UI in Dashboard
- [ ] Lake storage setup (S3/R2)
- [ ] ELT pipeline for ERP/OA data
- [ ] Unified ID system implementation

### Phase 1: LLM-First MVP (Months 3-6) 🔄
**Strategy**: Depend on public LLM APIs, zero proprietary data required

**AI Designer Agent**:
- [ ] Photo upload → GPT-4V / Qwen-VL vision analysis
- [ ] Prompt engineering for scene description (no fine-tuning)
- [ ] Integration with Midjourney/DALL-E/SD API for rendering
- [ ] Few-shot examples in prompt (10-20 representative scenarios)

**Pricing Agent**:
- [ ] Hard-coded cost formulas for MVP
- [ ] LLM generates natural language explanations
- [ ] Manual profit threshold alerts
- [ ] **No 500K quotes needed** — start with rule-based approach

**Knowledge Base Builder**:
- [ ] Upload 10-50 key documents (not 10,000)
- [ ] Simple vector search (Supabase pgvector)
- [ ] LLM answers grounded in uploaded docs via RAG
- [ ] Curated > comprehensive approach

**Customer Service & Compliance**:
- [ ] GPT-4/Claude with system prompts
- [ ] Store conversation history for future analysis
- [ ] Simple sentiment analysis (use LLM, don't build model)
- [ ] Compliance: RAG over uploaded regulation docs only

**Key Metric**: Prove AI features drive engagement/revenue before investing in fine-tuning

### Phase 2: Assessment & Light Customization (Months 6-9) 🔮
**Goal**: Evaluate approach effectiveness, decide next steps

**Assessment Criteria**:
- [ ] **Usage Metrics**: Which AI features do partners use most?
- [ ] **LLM Performance**: Where do public LLMs fail? (collect failure cases)
- [ ] **Cost Analysis**: LLM API costs vs. revenue from AI features
- [ ] **Partner Feedback**: What delivers measurable business value?

**Decision Gate**: Based on assessment, choose one of:
- **Option A**: Continue with LLM APIs (if working well)
- **Option B**: Add light fine-tuning for specific high-value tasks
- **Option C**: Pivot strategy based on learnings

**Light Customization** (if justified):
- [ ] Fine-tune small model (Llama 3 8B) for highest-value use case
- [ ] Use LoRA/QLoRA — cheap, fast, reversible
- [ ] Keep public LLMs for general tasks

### Phase 3: Scale with Data Flywheel (Months 9-18) 🔮
**Only if**: Product-market fit achieved, 100+ paying partners

- [ ] **Selective Fine-Tuning** (not blanket)
  - AI Designer: 10K+ renders with feedback
  - Pricing: 5K+ quotes with outcome data
  - Skip CS/Compliance — public LLMs sufficient
  
- [ ] **Data Accumulation** (organic, not forced)
  - Every interaction stored for future training
  - Partner-consented data usage
  - Privacy-preserving aggregation
  
- [ ] **Hybrid Architecture**
  - Public LLMs for 80% of tasks
  - Fine-tuned models for 20% high-value predictions
  - Cost optimization via model routing

- [ ] Document search and retrieval API

### Phase 2+: Advanced Features (Only After PMF Validation)
**Timeline**: Months 9-18+ (contingent on traction)

**Decision Criteria** — Only proceed if:
- Monthly recurring revenue > $50K
- 100+ paying partners actively using AI features
- Clear ROI metrics showing AI drives revenue

- [ ] Fine-tuning pipeline preparation (if justified)
- [ ] Automated knowledge extraction from new projects
- [ ] Cross-agent data sharing and coordination
- [ ] Local deployment optimization (for enterprise customers)
- [ ] Selective fine-tuning for highest-value use cases only

---

## 6. Test Data

### 6.1 Synthetic Data Created

**Location:** `supabase/seed_data.sql`

| Entity | Count | Description |
|--------|-------|-------------|
| Tenants | 4 | Default + 3 test (enterprise/pro/basic plans) |
| Users | 12 | Various roles (admin/manager/sales/member) |
| Partners | 3 | Channel partners |
| Customers | 28 | Realistic Chinese names, addresses, contact info |
| Products | 18 | SKUs with JSONB specs, customizable options |
| Pricing | 16 | Tiered pricing, option add-ons, discount rules |
| Cost Components | 8 | For Pricing Agent calculations |
| Projects | 4 | Project records |
| Designs | 2 | Design proposals with cost breakdowns |
| Orders | 7 | Full workflow (pending → completed) |
| Payments | 9 | 3-phase payment records |
| Knowledge Documents | 47 | Covering all 6 categories |

### 6.2 Knowledge Base Sample Documents

| ID | Name | Category | Agents | Tags |
|----|------|----------|--------|------|
| kb-001 | Pergola Installation Manual v3.2.pdf | Installation | Designer, Service | pergola, installation, manual |
| kb-002 | California Building Code 2026.pdf | Compliance | Compliance | CA, building code, pergola |
| kb-003 | Sales Pitch Deck - Residential.pptx | Sales | Service, Pricing | pergola, sales, residential |
| kb-014 | ADU Permit Guide - Los Angeles.pdf | Compliance | Compliance | ADU, permit, Los Angeles |
| kb-032 | Seismic Zone Design Guide - CA.pdf | Compliance | Compliance, Designer | seismic, California, design |
| kb-041 | FEMA Flood Zone Map - FL.pdf | Compliance | Compliance | FEMA, flood zone, Florida |

---

## 7. Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Database** | Supabase (PostgreSQL) | Structured data, multi-tenancy, RLS |
| **Vector DB** | pgvector (PostgreSQL extension) | Embeddings, semantic search |
| **Lake Storage** | Cloudflare R2 / AWS S3 | Unstructured data (CAD, images, video) |
| **ELT** | dbt / Apache Spark | Data transformation |
| **AI Models** | Qwen (DashScope) | Image generation, text generation |
| **Embedding** | OpenAI / Qwen Embedding API | Vector generation |
| **Frontend** | HTML + Tailwind + Vanilla JS | Dashboard, Knowledge Base UI |
| **Deployment** | Cloudflare Pages | Static hosting, edge caching |

---

## 8. Key Insights from Industry Research

### 8.1 Data Aggregation vs. Data Fusion

**Traditional Data Aggregation:** Simple collection and summarization of tabular data.

**Our Requirement: Multi-modal Data Fusion**
- Connect a kitchen photo to an ERP order number
- Link CAD dimensions to project milestones
- Associate compliance docs with geographic regions

**Terminology:** "Unified Data Foundation" or "Multi-modal Lakehouse"

### 8.2 Why Lakehouse (Not Just Data Warehouse)

| Feature | Data Warehouse | Data Lake | Lakehouse |
|---------|---------------|-----------|-----------|
| Structured Data | ✅ | ⚠️ | ✅ |
| Images/CAD/Video | ❌ | ✅ | ✅ |
| SQL Analytics | ✅ | ❌ | ✅ |
| AI/ML Ready | ❌ | ⚠️ | ✅ |
| Schema Enforcement | Strict | None | Flexible |

### 8.3 Modern ELT + AI Embedding

**Traditional ELT:** Extract → Load → Transform (tabular only)

**AI-Enhanced ELT:**
1. Extract (from all sources)
2. Load (raw to lake)
3. Transform:
   - Structured: Clean, normalize, model
   - Unstructured: Extract metadata, generate embeddings
   - All: Create vector representations for RAG

### 8.4 Local Deployment Priority

**Why:** CAD designs, customer contracts, and proprietary knowledge are core IP assets.

**Approach:**
- Agent runs inside company network
- Data never leaves local environment
- API calls to LLM only send necessary context (not raw CAD files)

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Knowledge Base Coverage | 100+ documents | Count by category |
| Document Indexing Rate | < 5 minutes | Time from upload to searchable |
| RAG Accuracy | > 85% | Human evaluation of agent responses |
| Query Response Time | < 2 seconds | API latency for KB queries |
| Data Freshness | Real-time | ERP sync frequency |

---

## 10. Appendix

### 10.1 File Locations

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Multi-tenant database schema |
| `supabase/seed_data.sql` | Test data including 47 KB documents |
| `company-operations.html` | Knowledge Base UI implementation |
| `docs/DATA_AI_STRATEGY.md` | This document |

### 10.2 Related Documents

- `AI_PLATFORM_ARCHITECTURE.md` - Technical architecture details
- `docs/AI_Designer_Agent_Spec.md` - Designer Agent specification
- `docs/Pricing_Cost_Controller_Agent_Spec.md` - Pricing Agent spec
- `docs/Compliance_Manager_Agent_Spec.md` - Compliance Agent spec
- `docs/Customer_Service_Executive_Agent_Spec.md` - Service Agent spec

---

**Document Owner:** Nestopia Product Team  
**Review Cycle:** Monthly during active development, quarterly post-launch
