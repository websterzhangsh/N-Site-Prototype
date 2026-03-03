# AI Platform Architecture & Technical Design

**Version**: 1.0.0  
**Date**: 2026-02-26  
**Status**: Draft - For Review  

---

## 1. Executive Summary

This document outlines the architecture and phased implementation plan for building an AI-powered platform for outdoor living product customization business. The platform integrates multi-modal data (images, CAD files, text, structured data) with Large Language Models (LLM) to automate design, customer interaction, and business operations.

### 1.1 Current State
- **Implemented**: Photo-realistic rendering (Image Edit LLM), Basic chatbot (Chat LLM)
- **Gap**: Data silos, no RAG capability, manual design workflows

### 1.2 Target State
- Unified multi-modal data lake
- AI-enhanced ELT pipeline with vector embeddings
- RAG-powered intelligent assistant with domain knowledge
- Automated design-to-order workflow

---

## 2. Business Data Landscape

### 2.1 Data Categories

| Category | Data Type | Format | Volume Est. |
|----------|-----------|--------|-------------|
| **Master Data** | Product info, pricing | Structured (DB) | Low |
| | Customer info | Structured (DB) | Medium |
| | Success samples | Image, Video | High |
| | Site information | Image, Text | High |
| **Transaction Data** | Orders, Payments, Contracts | Structured + Blob | Medium |
| **Design Artifacts** | Master plan (总平面图) | CAD | Medium |
| | Rendering (效果图) | Image | High |
| | Layout plan (平面布置图) | CAD | Medium |
| | Product design (产品设计图) | CAD | Medium |
| | Foundation design (基础设计图) | CAD | Low |
| | Paving design (地面铺装图) | CAD | Low |
| **Engineering Docs** | Structural calculations | PDF, Text | Low |
| | Permits & certifications | PDF, Text | Low |
| **Installation** | Assembly manual + video | PDF, Video | Low |

### 2.2 Data Flow Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Manual Input  │  Design Tools   │     ERP/OA      │   Customer Channels   │
│  (照片/测量)     │  (CAD/Laser)    │  (订单/合同)    │   (微信/WhatsApp)     │
└────────┬────────┴────────┬────────┴────────┬────────┴──────────┬────────────┘
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-MODAL DATA LAKE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Object Store │  │ Document DB  │  │ Relational DB│  │ Vector Store │     │
│  │ (Images/CAD) │  │ (Contracts)  │  │ (Orders)     │  │ (Embeddings) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI PROCESSING LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Image Edit   │  │ Text/Chat    │  │ RAG Engine   │  │ Analytics    │     │
│  │ (Image LLM)  │  │ (Chat LLM)   │  │ (Retrieval)  │  │ (Insights)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AI Designer  │  │ Smart Chat   │  │ Knowledge    │  │ Workflow     │     │
│  │ (效果图)      │  │ (客服助手)   │  │ Base (FAQ)   │  │ Automation   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PRESENTATION LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Web Application (React/Next.js)                  │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │  │ Landing │  │Designer │  │ Chatbot │  │ Gallery │  │  Admin  │   │    │
│  │  │  Page   │  │  Tool   │  │  Widget │  │  View   │  │ Console │   │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                        (Cloudflare Pages Functions)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /api/chat      /api/design-generate    /api/rag-query    /api/kb   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │  LLM Service  │  │  RAG Service  │  │ Vector Service│                    │
│  │  (Unified IF) │  │  (Retrieval)  │  │  (Embedding)  │                    │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                    │
│          │                  │                  │                             │
│          ▼                  ▼                  ▼                             │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                    Model Adapter Layer                             │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │      │
│  │  │ Chat    │  │ Image   │  │ Embed   │  │ Future  │               │      │
│  │  │ Model   │  │ Model   │  │ Model   │  │ Models  │               │      │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │      │
│  └───────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │  Object Store │  │  Vector DB    │  │  Metadata DB  │                    │
│  │  (Cloudflare  │  │  (Supabase    │  │  (Supabase    │                    │
│  │   R2 / OSS)   │  │   pgvector)   │  │   Postgres)   │                    │
│  └───────────────┘  └───────────────┘  └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │  LLM Provider │  │  ERP System   │  │  OA System    │                    │
│  │  (API)        │  │  (Optional)   │  │  (Optional)   │                    │
│  └───────────────┘  └───────────────┘  └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Tailwind CSS | Current stack, responsive |
| **Hosting** | Cloudflare Pages | Edge deployment, serverless |
| **API** | Cloudflare Functions | Low latency, auto-scaling |
| **LLM** | LLM Provider (pluggable) | Multi-provider support via adapter |
| **Vector DB** | Supabase pgvector | PostgreSQL native, easy setup |
| **Object Store** | Cloudflare R2 / Aliyun OSS | Multi-modal data storage |
| **Metadata** | Supabase PostgreSQL | Relational data, easy API |

### 3.3 LLM Model Strategy

#### 3.3.1 Chat Models (Priority Order)
```
1. [Primary Chat Model]       (Fast, cost-effective)
2. [Primary Chat Model v2]    (Version pinned)
3. [Enhanced Chat Model]      (Fallback - higher quality)
4. [Legacy Chat Model]        (Legacy fallback)
```

#### 3.3.2 Image Edit Models (Priority Order)
```
1. [Image Edit Model - Max]
2. [Image Edit Model - Max v2]
3. [Image Edit Model - Plus]
4. [Image Edit Model - Plus v2]
5. [Image Edit Model - Plus v3]
6. [Image Edit Model - Base]
```

#### 3.3.3 Embedding Models (For RAG)
```
1. [Text Embedding v3]       (Recommended)
2. [Text Embedding v2]       (Fallback)
```

---

## 4. RAG Architecture (Phase 2 Focus)

### 4.1 RAG System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RAG PIPELINE                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        INDEXING PIPELINE                             │    │
│  │                                                                      │    │
│  │   Documents    ┌──────────┐   ┌──────────┐   ┌──────────┐           │    │
│  │   (PDF/MD/    →│  Chunk   │ → │ Embedding│ → │  Vector  │           │    │
│  │    Text)       │  Split   │   │  Model   │   │   Store  │           │    │
│  │                └──────────┘   └──────────┘   └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        QUERY PIPELINE                                │    │
│  │                                                                      │    │
│  │   User Query   ┌──────────┐   ┌──────────┐   ┌──────────┐           │    │
│  │   ──────────→  │ Embedding│ → │ Semantic │ → │  Top-K   │           │    │
│  │                │  Model   │   │  Search  │   │ Results  │           │    │
│  │                └──────────┘   └──────────┘   └────┬─────┘           │    │
│  │                                                   │                  │    │
│  │                                                   ▼                  │    │
│  │                               ┌──────────────────────────────┐      │    │
│  │                               │     Context + Query          │      │    │
│  │                               │          ↓                   │      │    │
│  │                               │      LLM (Chat Model)        │      │    │
│  │                               │          ↓                   │      │    │
│  │                               │   Grounded Response          │      │    │
│  │                               └──────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Knowledge Base Structure

| Knowledge Category | Content | Priority |
|--------------------|---------|----------|
| **Product Catalog** | Product specs, features, pricing | P0 |
| **FAQ** | Common customer questions | P0 |
| **Installation Guide** | Assembly instructions | P1 |
| **Permit Requirements** | Local building codes, regulations | P1 |
| **Case Studies** | Past project summaries | P2 |
| **Industry Standards** | Material specs, safety standards | P2 |

### 4.3 RAG API Design

```typescript
// POST /api/rag-query
interface RAGQueryRequest {
  query: string;
  filters?: {
    category?: string[];    // Filter by knowledge category
    date_range?: [string, string];
  };
  top_k?: number;           // Number of chunks to retrieve (default: 5)
  include_sources?: boolean; // Return source documents
}

interface RAGQueryResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: {
      source: string;
      category: string;
      relevance_score: number;
    };
  }>;
  model_used: string;
}
```

---

## 5. CAD Processing Architecture (Design Data Asset)

> **Strategic Importance**: Design is the core of our business. CAD files contain critical data assets including product specifications, spatial relationships, material information, and engineering parameters. Proper handling of CAD data is essential for AI-powered design automation.

### 5.1 CAD Data Asset Inventory

| CAD Type | Contains | Business Value |
|----------|----------|----------------|
| **总平面图 (Master Plan)** | Site layout, building positions, dimensions | Project scoping, customer visualization |
| **平面布置图 (Layout Plan)** | Room dimensions, furniture placement | Customer communication, installation planning |
| **产品设计图 (Product Design)** | Product specs, materials, assembly details | Manufacturing, quality control |
| **基础设计图 (Foundation)** | Structural dimensions, load calculations | Engineering compliance |
| **地面铺装图 (Paving Design)** | Ground treatment, drainage | Installation guidance |

### 5.2 CAD File Formats & Complexity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAD FORMAT LANDSCAPE                               │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  2D Formats     │  │  3D Formats     │  │  Point Cloud    │              │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │              │
│  │  • DWG (主流)   │  │  • STEP         │  │  • LAS/LAZ      │              │
│  │  • DXF (交换)   │  │  • IGES         │  │  • E57          │              │
│  │  • PDF          │  │  • OBJ/FBX      │  │  • PLY          │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│         │                     │                     │                        │
│         ▼                     ▼                     ▼                        │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    SEMANTIC EXTRACTION                           │        │
│  │  • Dimensions (尺寸)      • Materials (材料)                     │        │
│  │  • Spatial relations      • Annotations (标注)                   │        │
│  │  • Component hierarchy    • Bill of Materials (BOM)              │        │
│  └─────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 CAD Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAD PROCESSING PIPELINE                               │
│                                                                              │
│  Stage 1: Ingestion                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  CAD File → Validation → Storage (R2/OSS) → Register Metadata    │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                                    ▼                                         │
│  Stage 2: Extraction                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │       │
│  │  │ Parser      │    │ Visual AI   │    │ Manual      │           │       │
│  │  │ (DXF/DWG)   │    │ (Vision LLM)│    │ Annotation  │           │       │
│  │  │             │    │             │    │             │           │       │
│  │  │ • Layers    │    │ CAD→Image   │    │ Designer    │           │       │
│  │  │ • Entities  │    │ → Analysis  │    │ Input       │           │       │
│  │  │ • Blocks    │    │ → Labels    │    │ → Verify    │           │       │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘           │       │
│  │         │                  │                  │                   │       │
│  │         └──────────────────┼──────────────────┘                   │       │
│  │                            ▼                                      │       │
│  │              ┌─────────────────────────┐                          │       │
│  │              │   Unified Metadata      │                          │       │
│  │              │   (JSON Schema)         │                          │       │
│  │              └─────────────────────────┘                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                                    ▼                                         │
│  Stage 3: Enrichment                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  • Text Embedding (标注文字 → Vector)                             │       │
│  │  • Image Embedding (渲染图 → Vector)                              │       │
│  │  • Relationship Graph (组件关系)                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                                    ▼                                         │
│  Stage 4: Application                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  • Semantic Search (按尺寸/风格/材料查找类似设计)                 │       │
│  │  • Auto Quote (从 BOM 自动报价)                                   │       │
│  │  • Design Reuse (模板化设计复用)                                  │       │
│  │  • Quality Check (设计规范自动校验)                               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 CAD Metadata Schema

```json
{
  "file_info": {
    "id": "uuid",
    "original_filename": "project_001_layout.dwg",
    "format": "dwg",
    "version": "2024",
    "file_size": 2048576,
    "storage_path": "cad/2026/02/project_001_layout.dwg"
  },
  "project_context": {
    "project_id": "PRJ-2026-001",
    "customer_id": "CUST-123",
    "design_type": "平面布置图",
    "design_stage": "initial",
    "version": 1
  },
  "extracted_data": {
    "dimensions": {
      "overall_width": 8500,
      "overall_depth": 4200,
      "overall_height": 3000,
      "unit": "mm"
    },
    "components": [
      {
        "name": "sunroom_frame",
        "type": "structure",
        "material": "aluminum_alloy",
        "dimensions": {"w": 8500, "d": 4200, "h": 3000}
      },
      {
        "name": "glass_panel",
        "type": "enclosure", 
        "material": "tempered_glass",
        "quantity": 12,
        "spec": "8mm_low_e"
      }
    ],
    "annotations": [
      {"text": "双层中空玻璃", "position": [1200, 800], "type": "material"},
      {"text": "8500", "position": [4250, 100], "type": "dimension"}
    ],
    "layers": ["structure", "glass", "dimension", "annotation", "furniture"]
  },
  "ai_analysis": {
    "style": "modern_minimalist",
    "space_type": "sunroom",
    "estimated_price_range": "80000-120000",
    "similar_projects": ["PRJ-2025-088", "PRJ-2025-102"],
    "confidence_score": 0.85
  },
  "embeddings": {
    "text_embedding_id": "emb-txt-001",
    "image_embedding_id": "emb-img-001"
  }
}
```

### 5.5 Technology Components

| Component | Technology Options | Recommendation |
|-----------|-------------------|----------------|
| **DXF Parser** | `dxf-parser` (JS), `ezdxf` (Python) | `ezdxf` for accuracy |
| **DWG Parser** | ODA SDK, LibreDWG, Autodesk Forge | Autodesk Forge (if budget allows) |
| **CAD→Image** | LibreCAD, QCAD, Autodesk Viewer | Cloud-based converter |
| **Visual AI** | Vision LLM (e.g. GPT-4V, etc.) | Configurable via adapter |
| **3D Processing** | Open3D, Three.js | Based on use case |
| **Point Cloud** | CloudCompare, PDAL | Phase 3+ consideration |

### 5.6 Phased CAD Implementation

| Phase | Capability | Technology |
|-------|------------|------------|
| **Phase 1** | Store CAD + Manual metadata | R2 + Postgres |
| **Phase 1.5** | DXF parsing (basic) | `dxf-parser` |
| **Phase 2** | CAD→Image + Vision LLM analysis | Converter + Vision LLM |
| **Phase 2.5** | Semantic search on CAD | Vector DB + Embedding |
| **Phase 3** | Full DWG parsing + BOM extraction | Autodesk Forge |
| **Phase 3+** | 3D/Point cloud processing | Specialized tools |

### 5.7 CAD-Specific API Endpoints

```
POST   /api/cad/upload          - Upload CAD with metadata
GET    /api/cad/:id             - Get CAD file + metadata
GET    /api/cad/:id/preview     - Get rendered preview image
POST   /api/cad/:id/analyze     - Trigger AI analysis
GET    /api/cad/:id/components  - Get extracted components/BOM
GET    /api/cad/search          - Search by dimensions/style/material
POST   /api/cad/:id/annotate    - Add manual annotations
```

---

## 6. Phased Implementation Plan

### 5.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION ROADMAP                               │
│                                                                              │
│  Phase 0          Phase 1           Phase 2           Phase 3               │
│  (Completed)      (Q1 2026)         (Q2 2026)         (Q3-Q4 2026)          │
│                                                                              │
│  ┌─────────┐      ┌─────────┐       ┌─────────┐       ┌─────────┐           │
│  │ Basic   │      │ Data    │       │ RAG &   │       │ Full    │           │
│  │ AI      │  →   │ Lake    │   →   │ Smart   │   →   │ Auto    │           │
│  │ Features│      │ Setup   │       │ Search  │       │ Workflow│           │
│  └─────────┘      └─────────┘       └─────────┘       └─────────┘           │
│                                                                              │
│  ✅ Chatbot       □ Object Store    □ Vector DB       □ Design Automation   │
│  ✅ Image Edit    □ Metadata DB     □ Embedding       □ ERP Integration     │
│  ✅ Gallery       □ File Upload     □ RAG API         □ Analytics Dashboard │
│                   □ Basic Search    □ Smart Chat      □ Workflow Engine     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Phase 0: Foundation (Completed)

**Status**: ✅ Complete

| Feature | Status | Technology |
|---------|--------|------------|
| Landing page with product showcase | ✅ | React + Tailwind |
| AI Designer (photo-realistic rendering) | ✅ | Image Edit LLM |
| Basic chatbot | ✅ | Chat LLM |
| Multi-language support (CN/EN) | ✅ | Custom i18n |
| Model fallback mechanism | ✅ | Priority-based |

### 5.3 Phase 1: Data Lake Foundation

**Timeline**: 4-6 weeks  
**Goal**: Establish unified data storage and basic retrieval

#### 5.3.1 Deliverables

| Component | Description | Technology |
|-----------|-------------|------------|
| **Object Storage** | Store images, CAD files, videos | Cloudflare R2 |
| **Metadata Database** | File metadata, relationships | Supabase PostgreSQL |
| **Upload API** | File upload with metadata | Cloudflare Functions |
| **Admin Console** | Basic file management UI | React |

#### 5.3.2 Database Schema

```sql
-- File metadata table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,  -- image, cad, video, pdf
    category VARCHAR(50),             -- product, case_study, manual
    storage_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB,                   -- Flexible metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base content
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,    -- faq, product, permit, guide
    language VARCHAR(10) DEFAULT 'zh',
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_zh VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(50) NOT NULL,    -- sunroom, pavilion, windproof
    description_zh TEXT,
    description_en TEXT,
    price_range VARCHAR(100),
    features JSONB,
    images UUID[],                     -- References to files table
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.3.3 API Endpoints

```
POST   /api/files/upload       - Upload file to object storage
GET    /api/files/:id          - Get file metadata
GET    /api/files              - List files with filters
DELETE /api/files/:id          - Delete file

GET    /api/kb                 - List knowledge base entries
POST   /api/kb                 - Create knowledge entry
PUT    /api/kb/:id             - Update knowledge entry
GET    /api/kb/search          - Basic keyword search
```

### 5.4 Phase 2: RAG & Intelligent Search

**Timeline**: 6-8 weeks  
**Goal**: Enable AI-powered semantic search and contextual responses

#### 5.4.1 Deliverables

| Component | Description | Technology |
|-----------|-------------|------------|
| **Vector Database** | Store embeddings | Supabase pgvector |
| **Embedding Pipeline** | Convert text to vectors | Embedding LLM |
| **RAG Engine** | Retrieval + generation | Custom + Chat LLM |
| **Smart Chatbot** | Context-aware responses | Enhanced chat API |
| **Knowledge Admin** | Manage KB with preview | React |

#### 5.4.2 Vector Schema Extension

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge base
ALTER TABLE knowledge_base 
ADD COLUMN embedding vector(1536);

-- Create vector index for fast similarity search
CREATE INDEX ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Embedding chunks for long documents
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES knowledge_base(id),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 5.4.3 RAG Implementation

```javascript
// Simplified RAG flow
async function ragQuery(query, options = {}) {
  // 1. Embed the query
  const queryEmbedding = await embedText(query);
  
  // 2. Semantic search in vector DB
  const relevantChunks = await vectorSearch(queryEmbedding, {
    top_k: options.top_k || 5,
    filters: options.filters
  });
  
  // 3. Build context from retrieved chunks
  const context = relevantChunks
    .map(chunk => chunk.content)
    .join('\n\n---\n\n');
  
  // 4. Generate response with context
  const response = await llmChat([
    { role: 'system', content: RAG_SYSTEM_PROMPT },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
  ]);
  
  return {
    answer: response.content,
    sources: relevantChunks.map(c => ({
      content: c.content.substring(0, 200),
      source: c.metadata.source,
      score: c.similarity
    }))
  };
}
```

#### 5.4.4 Enhanced Chat Integration

```javascript
// Smart chat with RAG fallback
async function smartChat(message, history) {
  // Check if question needs knowledge retrieval
  const needsRAG = await classifyIntent(message);
  
  if (needsRAG) {
    // Use RAG for knowledge-based questions
    return await ragQuery(message);
  } else {
    // Use standard chat for general conversation
    return await standardChat(message, history);
  }
}
```

### 5.5 Phase 3: Workflow Automation

**Timeline**: Q3-Q4 2026  
**Goal**: End-to-end automation from inquiry to design

#### 5.5.1 Planned Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Auto Quote** | Generate quotes from requirements | P0 |
| **Design Workflow** | Automated design generation pipeline | P0 |
| **Customer Portal** | Self-service design customization | P1 |
| **ERP Integration** | Sync orders and inventory | P1 |
| **Analytics Dashboard** | Business insights from AI interactions | P2 |

#### 5.5.2 Workflow Engine Concept

```
Customer Inquiry
       │
       ▼
┌──────────────────┐
│ Intent Detection │ ← LLM classifies: quote/design/info/support
└────────┬─────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    ▼         ▼         ▼          ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Quote │ │Design │ │  RAG  │ │Support│
│ Flow  │ │ Flow  │ │ Query │ │ Flow  │
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │         │         │
    ▼         ▼         ▼         ▼
┌─────────────────────────────────────┐
│         Response Generation          │
│    (Context-aware, multi-modal)      │
└─────────────────────────────────────┘
```

---

## 6. Security & Compliance

### 6.1 Data Security

| Aspect | Measure |
|--------|---------|
| **API Keys** | Stored in Cloudflare environment variables |
| **Data in Transit** | HTTPS/TLS 1.3 |
| **Data at Rest** | Encrypted storage (R2/Supabase) |
| **Access Control** | Row-level security in Supabase |
| **Audit Log** | Track all AI interactions |

### 6.2 AI Safety

| Concern | Mitigation |
|---------|------------|
| **Hallucination** | RAG with source citations |
| **Data Leakage** | Input/output filtering |
| **Cost Control** | Token usage monitoring, rate limits |
| **Model Fallback** | Priority-based degradation |

---

## 7. Success Metrics

### 7.1 Phase 1 KPIs

| Metric | Target |
|--------|--------|
| File upload success rate | > 99% |
| Search latency (P95) | < 500ms |
| Storage utilization | Track growth |

### 7.2 Phase 2 KPIs

| Metric | Target |
|--------|--------|
| RAG answer accuracy | > 85% (human eval) |
| Source citation rate | > 90% |
| Query latency (P95) | < 2s |
| User satisfaction | > 4.0/5 |

### 7.3 Phase 3 KPIs

| Metric | Target |
|--------|--------|
| Auto-quote accuracy | > 90% |
| Design generation time | < 60s |
| Inquiry-to-quote conversion | +20% |
| Support ticket reduction | -30% |

---

## 8. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LLM service outage | High | Medium | Multi-model fallback |
| Data loss | High | Low | Regular backups, redundancy |
| Cost overrun | Medium | Medium | Usage monitoring, quotas |
| Poor RAG quality | Medium | Medium | Iterative tuning, feedback loop |
| Integration complexity | Medium | High | Phased approach, MVP first |

---

## 9. Next Steps

### Immediate Actions (Week 1-2)

1. **Review this document** - Gather stakeholder feedback
2. **Finalize Phase 1 scope** - Prioritize deliverables
3. **Set up Supabase** - Database and authentication
4. **Configure R2 storage** - Object storage bucket

### Phase 1 Kickoff (Week 3+)

1. Design detailed database schema
2. Implement file upload API
3. Build admin console UI
4. Create knowledge base seed data
5. Deploy and test

---

## 10. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - combining search with LLM |
| **Embedding** | Vector representation of text for semantic similarity |
| **pgvector** | PostgreSQL extension for vector operations |
| **Chunking** | Splitting documents into smaller pieces for embedding |

### B. Reference Documents

- `LLM_API_DESIGN.md` - LLM service integration details
- `DESIGN_TOOL_API.md` - AI Designer API specification
- `INTELLIGENT_DESIGNER_STRATEGY.md` - Design generation strategy

---

*Document Version: 1.0.0*  
*Last Updated: 2026-02-26*  
*Status: Draft - Pending Review*
