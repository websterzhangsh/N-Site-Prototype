# N-Site-Prototype Requirements Specification
# Nestopia Platform 需求规格说明书

**Project Name**: Nestopia Platform (N-Site-Prototype)  
**Version**: 6.0.0  
**Last Updated**: 2026-03-12  
**Maintainer**: websterzhangsh  
**Live URL**: https://n-site-prototype.pages.dev  
**Repository**: https://github.com/websterzhangsh/N-Site-Prototype

---

## 1. Project Overview

### 1.1 Background
Nestopia is a B2B platform for outdoor living products — sunrooms, ADU (Accessory Dwelling Units), pergolas, and zip blinds. The platform serves as a public-facing product showcase, a partner registration and management portal, and a multi-tenant dashboard for partner companies — powered by five AI Agents that act as "super partners" for small enterprise owners.

### 1.2 Project Goals
- Public website for product showcase and customer lead generation (To C)
- B2B Partner Program with registration and sign-in (To B)
- Multi-tenant dashboard for partner companies (projects, orders, workflow, AI agents)
- **Five AI Agents** that deliver business outcomes (OUTPUT-focused, not tool-focused)
- Fine-tuned models with industry-specific training data to build platform IP
- Supabase-backed authentication, database, and edge functions

### 1.3 Core Philosophy: OUTPUT > HOW

The Nestopia AI Agent architecture is designed around a fundamental principle: **deliver business outcomes, not tool features**. Small enterprise owners don't need another ERP system — they need "super partners" who co-work with them to close deals, protect margins, eliminate risk, and grow customers.

| Dimension | Traditional ERP | Nestopia Agent |
|-----------|----------------|----------------|
| User Goal | Learn to use tools | Get business results |
| Interaction | Fill forms → query reports | Natural language → direct deliverables |
| Value Metric | Feature completeness | Business KPI improvement |
| Learning Curve | Training + manuals | Zero learning, ask & receive |
| Success Criteria | Data entry complete | Deals closed / Profit grown / Zero complaints |

### 1.4 Target Users

| User Type | Description |
|-----------|-------------|
| End Customers (C) | Homeowners browsing products and submitting design consultation requests |
| Partners (B2B) | Contractors, landscape designers, architects, real estate agents — registered companies using the platform |
| Partner Admins | Admin users within a partner tenant, managing team, projects, orders |
| Platform Admin | Internal Nestopia staff (future) |

### 1.5 Development Methodology
- **Approach**: Agile + AI-native (Vibe Coding)
- **Deployment**: Cloudflare Pages (auto-deploy from GitHub)
- **Architecture**: Multi-page static site (NOT SPA) — new pages must be added to build script, `_routes.json`, `_redirects`, and `_headers`

---

## 2. Architecture Overview

### 2.1 Current Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Tailwind CSS (CDN) |
| Icons | Font Awesome 6.x |
| Build | Vite (build tool), npm |
| Deployment | Cloudflare Pages (auto-deploy from `main` branch) |
| Backend (planned) | Supabase (PostgreSQL + Edge Functions + Auth) |
| AI/LLM | Alibaba Qwen API (chatbot integration on homepage) |
| AI Agents (planned) | Fine-tuned models with industry-specific training data |
| Version Control | Git + GitHub |

### 2.2 Site Architecture (Multi-Page Static)

```
index.html          → Homepage (product showcase, contact form, chatbot)
partners.html       → Partner Program page (features, registration form)
login.html          → Partner sign-in (multi-tenant aware)
company-operations.html      → Company Operations (overview, workflow, agents, projects, team, settings)
team-management.html → Team management page
```

**Critical Build Lesson**: This is a multi-page static site, NOT a SPA. When adding new `.html` pages:
1. Add to `package.json` build script (`cp` command)
2. Add to `_routes.json` exclude list
3. Add to `_redirects` with 200 rule
4. Add to `_headers` for cache control

### 2.3 File Structure

```
/
├── index.html                  # Homepage
├── partners.html               # Partner program + registration
├── login.html                  # Partner sign-in
├── company-operations.html     # Company Operations (formerly dashboard)
├── team-management.html        # Team management
├── package.json                # Build config
├── _routes.json                # Cloudflare routing
├── _redirects                  # Cloudflare redirects
├── _headers                    # Cloudflare HTTP headers
├── public/images/              # Static image assets (~40 images)
│   ├── hero/                   # Hero carousel images
│   ├── gallery/                # Gallery images
│   ├── products/               # Product images (sunroom, pergola, windproof)
│   └── partner-logo.png        # Test partner logo
├── database/                   # Legacy schema (superseded by supabase/)
│   └── schema.sql
├── supabase/                   # Supabase configuration
│   ├── schema.sql              # Multi-tenant database schema
│   ├── config.toml             # Supabase project config
│   ├── .env.example            # Environment variables template
│   └── functions/              # Edge Functions
│       ├── auth-login/         # Login handler
│       ├── auth-middleware/     # JWT verification
│       └── tenant-config/      # Tenant configuration
└── docs/                       # Strategy & architecture documentation
    ├── REQUIREMENTS.md          # This document
    ├── AI_Agents_Strategy_Whitepaper.docx
    ├── Gap_Analysis_Report.docx
    ├── business-workflow.md
    └── multi-tenant-architecture.md
```

---

## 3. Implemented Features

### 3.1 Homepage (`index.html`) — ✅ Complete

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-001 | Responsive Layout | Mobile-first design, adapts to all screen sizes | ✅ |
| FR-002 | Navigation | Sticky header with smooth scroll to sections | ✅ |
| FR-003 | Hero Carousel | 3-slide auto-rotating product showcase | ✅ |
| FR-004 | Product Showcase | 3 product categories: Sunroom, Pergola, Zip Blinds | ✅ |
| FR-005 | Service Process | 3-step "Get Started" section | ✅ |
| FR-006 | Design Consultation Form | 3-step intake wizard (contact → space → preferences) | ✅ |
| FR-007 | Chatbot UI | Floating chat widget with AI-powered responses (Qwen API) | ✅ |
| FR-008 | Footer | Company info, quick links, solutions, support links | ✅ |
| FR-009 | Bilingual Support | Chinese/English language toggle | ✅ |
| FR-010 | Gallery | Product image gallery with hover effects | ✅ |

### 3.2 Partners Page (`partners.html`) — ✅ Complete

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-020 | Hero Section | Full-viewport hero with background image, Apply Now + Learn More CTAs | ✅ |
| FR-021 | Sign In Button | Top-right header link to login.html | ✅ |
| FR-022 | Why Partner With Us | 6 feature cards (Scenario Design, AI Preview, Comfort, Materials, Turnkey, Warranty) | ✅ |
| FR-023 | Partner Registration Form | 3-step wizard: Company Info → Admin Account → Success | ✅ |
| FR-024 | Company Info Form | Legal name, DBA, EIN, full US address (50 states), phone, email, website | ✅ |
| FR-025 | Business Details | Business type dropdown, company size, description textarea | ✅ |
| FR-026 | Plan Selection | 3 plans: Starter ($0), Professional ($49), Enterprise (Custom) | ✅ |
| FR-027 | Terms Agreement | Checkbox for Terms of Service and Privacy Policy | ✅ |
| FR-028 | Admin Account Step | Full name, job title, email, password creation | ✅ |
| FR-029 | Success Confirmation | Shows company name, admin email, portal URL, selected plan | ✅ |
| FR-030 | CTA Section | "Ready to Partner With Us?" with Apply Now button | ✅ |

### 3.3 Login Page (`login.html`) — ✅ Complete

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-040 | Multi-tenant Login | Dynamic logo/name/color based on tenant slug | ✅ |
| FR-041 | Email/Password Auth | Login form with validation | ✅ |
| FR-042 | Password Toggle | Show/hide password visibility | ✅ |
| FR-043 | Remember Me | Persists token to localStorage vs sessionStorage | ✅ |
| FR-044 | Forgot Password | Placeholder link (feature coming soon) | ⏳ |
| FR-045 | Auth Token | Mock JWT token stored on login, redirects to dashboard | ✅ |
| FR-046 | English UI | Fully translated from Chinese to English | ✅ |

### 3.4 Company Operations (`company-operations.html`) — ✅ Structural Complete

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-050 | Sidebar Navigation | Fixed sidebar with nav sections: Main Menu, Agents, Settings | ✅ |
| FR-051 | Auth Guard | Redirects to login.html if no auth_token present | ✅ |
| FR-052 | Overview Page | Stats cards (projects, orders, quotes, revenue), recent projects table, activity feed | ✅ |
| FR-053 | Service Workflow | Complete 15-step timeline (Phase 1: Pre-Sale Design, Phase 2: Delivery & Implementation) | ✅ |
| FR-054 | AI Design Tool | Expandable within Step 4 of workflow — upload areas, generate button (stub) | ✅ |
| FR-055 | Page Switching | JS-based navigation between Overview and Workflow pages | ✅ |
| FR-056 | Tenant Branding | Dynamic logo ("Greenscape Builders") and name from config | ✅ |
| FR-057 | User Menu | Sign-out confirmation dialog | ✅ |
| FR-058 | Mobile Responsive | Collapsible sidebar on mobile | ✅ |
| FR-059 | AI Agents (sidebar) | 5 agent nav items: AI Designer, Pricing & Cost Controller, Compliance Manager, Customer Service Executive, Knowledge Base Builder | ✅ UI only |

### 3.5 Team Management (`team-management.html`) — ⏳ In Progress

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-060 | Team List | Employee list display with roles, status, contact info | ⏳ |
| FR-061 | Add/Remove Members | Basic team member CRUD operations | ⏳ |
| FR-062 | Role Management | Admin / Sales / Installer / Designer role assignment | ⏳ |
| FR-063 | Permission Control | Role-based access control (RBAC) for features and data | ⏳ |
| FR-064 | Task Assignment | Assign team members to projects with workload tracking | ⏳ |
| FR-065 | Performance Dashboard | Sales metrics, completed projects, customer ratings per member | ⏳ |
| FR-066 | Calendar & Scheduling | Team availability and installation crew scheduling view | ⏳ |

---

### 3.6 Projects Management — 🆕 Planned

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-070 | Project List | Card/table view of all projects with status filtering | 🆕 |
| FR-071 | Project Stages | 15-step workflow visualization (Design → Approval → Permit → Manufacturing → Install → Done) | 🆕 |
| FR-072 | Timeline View | Gantt chart or progress bar showing planned vs actual dates | 🆕 |
| FR-073 | Budget Tracking | Quote, collected payments, outstanding balance per project | 🆕 |
| FR-074 | Document Hub | AI design renders, contracts, permits, on-site photos linked to project | 🆕 |
| FR-075 | Installation Schedule | Crew assignment, calendar view, availability management | 🆕 |
| FR-076 | **Issues Tracker** | Flag and track project blockers, delays, customer concerns, resolution status | 🆕 |
| FR-077 | **Risk Management** | Proactive risk identification (compliance, timeline, budget, quality) with mitigation actions | 🆕 |
| FR-078 | **Risk Heat Map** | Visual dashboard showing high/medium/low risks across all active projects | 🆕 |
| FR-079 | Customer Communication Log | All interactions (email, call, message) logged against project timeline | 🆕 |

---

### 3.7 Settings Page — ⏳ In Progress

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-080 | Company Profile | Logo, name, address, contact information management | ⏳ |
| FR-081 | User Account | Password change, notification preferences | ⏳ |
| FR-082 | Knowledge Base | ✅ Document upload and management by 6 categories with tagging | ✅ |
| FR-083 | Integration Management | Third-party connections (CRM, payment, email services) | 🆕 |
| FR-084 | Notification Settings | Email/SMS alert rules and templates | 🆕 |
| FR-085 | Billing & Subscription | Plan details, invoice history, payment method management | 🆕 |

---

## 4. Service Workflow (15 Steps)

The complete service workflow is implemented as a visual timeline in the Dashboard:

### Phase 1 — Pre-Sale Design
| Step | Name | Payment |
|------|------|---------|
| 1 | Initial Information Collection | — |
| 2 | Product Animation | — |
| 3 | Preliminary Intent Confirmation | — |
| 4 | Real Scene Integration (AI Design Tool) | — |
| 5 | Design Generation | — |
| — | Collect Design Fee | 💰 Payment Milestone |

### Phase 2 — Delivery & Implementation
| Step | Name | Payment |
|------|------|---------|
| 6 | Detailed Information Collection (on-site measurement) | — |
| 7 | Generate Solution Rendering | — |
| 8 | Formal Quotation | — |
| 9 | Sign Contract & Pay Deposit | 💰 Payment Milestone |
| 10 | Generate Engineering Drawings | — |
| 11 | Manufacturing | — |
| — | Collect 2nd Payment | 💰 Payment Milestone |
| 13 | Shipping & Delivery | — |
| — | Collect 3rd Payment | 💰 Payment Milestone |
| 15 | Installation Complete (acceptance, training, warranty) | — |

### Simplified 6-Step Version (For C-end Marketing)

| Step | Name |
|------|------|
| 1 | Online Appointment |
| 2 | AI Auto-Measurement |
| 3 | AI Design & Rendering |
| 4 | Confirm Quote & Contract |
| 5 | Online Sign & Pay |
| 6 | Manufacturing & Installation |

---

## 5. Database Schema (Supabase PostgreSQL)

Located in `supabase/schema.sql`. Multi-tenant architecture with RLS.

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenants` | Partner companies | slug, name, status, plan, ui_config (JSONB), feature flags, quotas |
| `users` | All users across tenants | email, password_hash, role (super_admin/admin/manager/member), tenant_id |
| `user_sessions` | JWT session management | token, refresh_token, ip_address, user_agent, expires_at |
| `audit_logs` | Activity tracking | action, resource_type, old_values, new_values |
| `projects` | Client projects | title, type (sunroom/pergola/shutter), status, budget, timeline |
| `orders` | Order management | auto-generated order number, 3-stage payment tracking, production/logistics status |

**Security**: Row-Level Security (RLS) enabled for tenant data isolation.

---

## 6. Supabase Edge Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `auth-login` | POST /auth-login | Email/password login, JWT generation, audit logging |
| `auth-middleware` | — | JWT verification, tenant context injection |
| `tenant-config` | GET /tenant-config?slug=xxx | Returns tenant UI config and feature flags |

**Status**: Schema and functions are defined but Supabase Cloud instance is **not yet provisioned**. Currently using mock data for authentication.

---

## 7. AI Agents — Strategy & Specification

### 7.1 Design Philosophy

Nestopia AI Agents are **not traditional SaaS tools**. They are autonomous "super partners" that co-work with small enterprise owners. The design principle:

- **OUTPUT-focused**: Each agent delivers measurable business outcomes, not features to operate
- **Co-working model**: Agents proactively assist, not passively wait for commands
- **Industry-specific**: Fine-tuned on outdoor living / yard customization domain data
- **Platform IP**: Training data and models are proprietary competitive moats

### 7.2 Agent 1: AI Designer — "签单武器" (Deal-Closing Weapon)

**Core OUTPUT**: Increase customer deal-closing rate through instant visual impact

| Dimension | Detail |
|-----------|--------|
| **Market Positioning** | From "design tool" to "deal-closing weapon" |
| **Key Differentiator** | Real-scene fusion — AI plants products into the customer's actual yard photo with natural lighting, shadows, and proportions |
| **Current Status** | ✅ UI stub in workflow Step 4, ⏳ backend not implemented |

#### 7.2.1 Key Capabilities

| Capability | Traditional Approach | Nestopia AI Designer OUTPUT |
|-----------|---------------------|----------------------------|
| On-site Measurement | Upload photo → manually mark dimensions | Photo/scan → auto-extract dimensions → instant 3D model |
| Scene Fusion | Photoshop compositing | AI auto-plants product into real yard scene (natural lighting/shadows/proportions) |
| Instant Variants | Re-model and re-render | Customer says "change color" → 5-second new render, on-site comparison |
| Deal Mode | Send renders, wait for feedback | Tablet/phone projection → customer swipes to change options → decide on the spot |
| One-click Proposal | Export images, send email | Auto-generate beautiful proposal (design + quote + contract) → sign on the spot |

#### 7.2.2 Use Scenarios

- **Scene A: On-site Deal** — Bring tablet → photo the yard → AI fuses product in 30 seconds → customer "wow" → change options on the spot → sign deal
- **Scene B: Remote Proposal** — Customer sends yard photo → AI generates 3 options → auto-compose video proposal → customer confirms online
- **Scene C: Quick Inquiry** — Customer calls → partner sends product preview → AI generates render from description → customer books site visit

#### 7.2.3 Strategic Partnership: Digital Measurement Expert

**Future Differentiator**: Deep integration with a professional digital measurement solution vendor.

| Capability | Nestopia Current | Partner Enhancement |
|-----------|-----------------|---------------------|
| Measurement Precision | Photo estimation + manual input | Laser scanning / Photogrammetry / SLAM → mm-level precision |
| Data Collection | Single photo | 360° panoramic scan / Point cloud / 3D reconstruction |
| Complex Terrain | Flat yards only | Irregular terrain / Elevation changes / Existing structure integration |
| Output Format | 2D fusion image | CAD drawings / BIM models / Engineering-grade measurement reports |

**Integration Scenarios**:
- **Professional On-site**: Partner scanning device → 5-min yard scan → point cloud model → AI Designer fuses product → engineering-grade output
- **Remote + Validation**: Customer self-scans via partner SDK app → cloud model → partner verifies key dimensions on-site → dual-source optimized design
- **Expert Mode**: Complex terrain projects → auto-trigger "expert measurement" workflow → partner dispatches surveyor → data feeds Nestopia for compliant design

**Three-Layer Moat**:
1. **Data Layer**: Partner measurement data + Nestopia design data → jointly trained proprietary models
2. **Workflow Layer**: Seamless "measure → design → quote → sign" pipeline, zero data gaps
3. **Certification Layer**: Co-branded "Nestopia Precision Measurement Partner" certification, establishing industry standard

**Business Model Tiers**:

| Tier | Service | Pricing |
|------|---------|---------|
| Basic | Photo estimation + AI fusion | Included in Nestopia subscription |
| Professional | SDK integration + customer self-scan | Per-scan fee, revenue sharing |
| Expert | On-site measurement + engineering delivery | Per-project fee, partner-led |
| Enterprise | Custom devices + API access + proprietary model | Annual license |

#### 7.2.4 Fine-tune Training Strategy

| Data Source | Target Volume | Purpose |
|------------|---------------|---------|
| Real yard scene photos | 100,000+ | Train scene fusion naturalness |
| Product-in-context renders | Per product category | Train product "planting" for sunroom/ADU/pergola/blinds |
| Style transfer datasets | American/Modern/Neo-Chinese | One-click style switching |
| Regional adaptation data | North American building norms, common yard types, local plants | Localized design intelligence |

**Competitive Moat**: Only Nestopia owns "outdoor living scene" proprietary training data — generic AI cannot match the domain-specific fusion quality.

---

### 7.3 Agent 2: Pricing & Cost Controller — "利润保镖" (Profit Bodyguard)

**Core OUTPUT**: Maximize profit per deal while maintaining market competitiveness

| Dimension | Detail |
|-----------|--------|
| **Market Positioning** | From "calculator" to "profit bodyguard" |
| **Key Differentiator** | Dynamic pricing intelligence — AI considers material costs, regional competition, seasonal demand, and customer budget to find the "highest win-rate price point" |
| **Current Status** | ✅ Nav item in dashboard, ⏳ backend not implemented |

#### 7.3.1 Key Capabilities

| Capability | Traditional Approach | Nestopia Pricing Agent OUTPUT |
|-----------|---------------------|------------------------------|
| Smart Quotation | Excel formulas | Input customer needs → AI matches optimal materials → 3-tier quote (Basic/Standard/Premium) |
| Profit Alert | Discover losses in month-end reports | Real-time profit margin display during quoting; auto-alert + optimization suggestions when below target |
| Cost Tracking | Manual procurement records | Connect supplier APIs, real-time material price feeds, auto-update cost baselines |
| Competitive Pricing | Gut-feeling pricing | AI analyzes regional competitor prices, seasonal demand, customer budget → recommend "highest win-rate" price |
| Hidden Cost Coverage | Often forgotten | Auto-calculate transport, installation, tax, after-sale reserves — zero omissions |
| Plan Optimization | Manual adjustment | Budget-limited customer → AI recommends "profit-preserving" alternatives (swap materials/reduce config) |

#### 7.3.2 Use Scenarios

- **Scene A: Quick Quote** — Customer describes needs → AI generates 3-tier quote in 30 seconds → partner flexibly selects tier → quote on the spot
- **Scene B: Margin Defense** — Customer haggles → AI calculates "minimum acceptable price" → below threshold auto-warns "suggest decline or change plan" → protect margin
- **Scene C: Batch Optimization** — Month-end review → AI analyzes all quotes, identifies "profit killers" (material cost increase unnoticed) → auto-adjust next month pricing strategy

#### 7.3.3 Fine-tune Training Strategy

| Data Source | Target Volume | Purpose |
|------------|---------------|---------|
| Historical quotes + close results | 500,000+ | Train optimal pricing models |
| Regional pricing models | Per state/city | Labor, transport, tax variance by region |
| Material price trends | Seasonal + supply chain | Material cost prediction (season, supply chain, exchange rates) |
| Customer persona pricing | By customer segment | Payment willingness models (villa/apartment/commercial) |

**Competitive Moat**: Only Nestopia owns "outdoor living industry" real transaction data — generic pricing tools cannot provide industry-optimal strategies.

---

### 7.4 Agent 3: Compliance Manager — "风险雷达" (Risk Radar)

**Core OUTPUT**: Zero-risk project delivery and fast permit approval

| Dimension | Detail |
|-----------|--------|
| **Market Positioning** | From "regulation lookup" to "zero-risk delivery" |
| **Key Differentiator** | Automatic compliance navigation — AI knows every county's building codes, HOA rules, and environmental restrictions before the project even starts |
| **Current Status** | ✅ Nav item in dashboard, ⏳ backend not implemented |

#### 7.4.1 Key Capabilities

| Capability | Traditional Approach | Nestopia Compliance Agent OUTPUT |
|-----------|---------------------|----------------------------------|
| Regulation Pre-check | Manually read regulation docs | Input project address + plan → AI identifies applicable regulations → generates compliance checklist |
| Permit Navigation | Consult lawyers / government offices | AI generates "permit application roadmap": which permits → what materials → where to submit → how long to approve |
| Auto-fill Applications | Hand-fill application forms | AI auto-fills application forms from project data → partner just signs and confirms |
| Risk Radar | Fix problems after they occur | Pre-project scan for potential risks (neighbor complaints, environmental limits) → proactive avoidance advice |
| Regulation Updates | Subscribe to emails/news | AI monitors regulation changes, auto-push "updates affecting your projects" |
| Case Library | Learn by trial and error | Same-industry, same-region, same-type project compliance case references |

#### 7.4.2 Use Scenarios

- **Scene A: Pre-project Launch** — After accepting the job → AI scans project address regulations → discovers HOA approval needed → prepare materials in advance → avoid post-construction stoppage
- **Scene B: Permit Application** — AI generates complete application package → partner one-click print/e-submit → track approval progress → auto-remind for supplementary materials
- **Scene C: Risk Alert** — AI monitors new local environmental restriction → auto-alert "3 active projects may be affected" → provide adjustment suggestions

#### 7.4.3 US Regional Compliance Requirements (Critical for Market Entry)

The Compliance Manager must handle the complex US regulatory landscape: **Federal baseline + State amendments + Local ordinances + HOA restrictions**.

**Federal Level Requirements:**
- **IRC 2024** (International Residential Code): Baseline for residential structures
- **IBC** (International Building Code): For commercial/multi-family applications
- **IECC** (International Energy Conservation Code): Energy efficiency requirements
- **ADA** (Americans with Disabilities Act): Accessibility requirements for public-facing structures

**State-Specific Requirements:**

| State | Key Requirements | Unique Challenges |
|-------|------------------|-------------------|
| **California** | CBC (California Building Code), Title 24 Energy, Seismic Design Cat D/E | ADU laws (SB9/SB897), strict energy codes, earthquake requirements |
| **Florida** | FBC (Florida Building Code), Wind load 115-180+ mph | Hurricane zones, Large Missile Impact Test for glass, flood zones (FEMA) |
| **Texas** | Varies by city (Houston no zoning, Dallas/Austin have zoning) | Clay soil expansion, tornado risk, flood zones (Harvey aftermath) |
| **Arizona** | CBC-based, extreme heat requirements | Thermal performance, dust/wind considerations |
| **Nevada** | CBC-based, desert climate | Similar to AZ, Las Vegas specific requirements |

**California Detailed Requirements:**
- **ADU (SB9/SB897)**: Max 800-1200 sq ft, height 16-25 ft, setbacks 4-5 ft side, 60-day approval mandate
- **Title 24**: Glass U-value ≤0.30, Solar Reflectance Index requirements
- **Seismic**: Engineer-stamped structural design required for most structures
- **Permit costs**: $1,000-$5,000 depending on city and scope

**Florida Detailed Requirements:**
- **Wind zones**: Inland 115-130 mph, Coast 140-180 mph, High-velocity >180 mph
- **AAMA 2100 Categories**: Category I-IV with increasing structural requirements
- **NOA (Notice of Acceptance)**: Product certification required for state approval
- **Flood zones**: BFE (Base Flood Elevation) compliance required in most areas

**HOA (Homeowners Association) Requirements:**
- **Coverage**: ~60% of US single-family homes under HOA jurisdiction
- **Approval process**: Architectural Review Committee, 30-60 day timeline
- **Common restrictions**: Style coordination, color palettes, material specifications, height limits, view/sunlight obstruction
- **Key insight**: HOA approval is SEPARATE from government permits and can be more restrictive

**Permit Types by Product:**

| Product | Building Permit | Electrical | Plumbing | HOA | Special |
|---------|----------------|------------|----------|-----|---------|
| Sunroom | ✅ Required | ⚠️ If outlets/lighting | ⚠️ If plumbing | ⚠️ Usually | Seismic (CA), Wind (FL) |
| ADU | ✅ Required | ✅ Required | ✅ Required | ⚠️ CA limited | Full residential code |
| Pergola (<200 sq ft) | ⚠️ Varies | ⚠️ If electrical | ❌ No | ⚠️ Usually | Setback compliance |
| Pergola (>200 sq ft) | ✅ Required | ⚠️ If electrical | ❌ No | ⚠️ Usually | Structural engineering |
| Windproof Blinds | ❌ Usually no | ❌ No | ❌ No | ⚠️ Often | Wind rating (FL) |

#### 7.4.4 Fine-tune Training Strategy

| Data Source | Target Volume | Purpose |
|------------|---------------|---------|
| Building regulations | All 50 US states + major counties | IRC, state amendments, local ordinances |
| HOA databases | Top 1000 HOAs by population | Architectural guidelines, approval processes |
| Permit process database | Per government office | Application workflows, material checklists, timelines, fees |
| Case law library | Real project compliance/violation cases | Train risk identification, common pitfalls |
| Dynamic update feeds | Government website monitoring | Real-time regulation changes, new legislation |
| FEMA flood maps | Nationwide coverage | Flood zone classification, BFE data |
| Seismic zone maps | USGS data | Seismic design categories by location |

**Data Sources:**
- **Public**: ICC (IRC/IBC), State government websites, Municode, FEMA
- **Commercial**: UpCodes API, BuildingAdvisor, HOA data services
- **User-contributed**: Partner-uploaded HOA guidelines, local knowledge
- **AI-extracted**: Automated parsing of PDF regulations

**Competitive Moat**: Only Nestopia builds an "outdoor living industry-specific" regulatory knowledge graph with **US regional depth** — generic legal AI cannot understand:
- Industry-specific scenarios (sunroom vs ADU vs pergola)
- Local nuances (CA Title 24 vs FL wind zones vs TX clay soil)
- HOA aesthetic requirements alongside building codes
- The interplay of federal/state/local/HOA四层审批

---

### 7.5 Agent 4: Customer Service Executive — "增长引擎" (Growth Engine)

**Core OUTPUT**: Boost customer satisfaction, retention, and referral-driven growth

| Dimension | Detail |
|-----------|--------|
| **Market Positioning** | From "customer service tool" to "growth engine" |
| **Key Differentiator** | Full-lifecycle customer management with emotional intelligence — AI doesn't just answer questions, it proactively identifies opportunities and prevents churn |
| **Current Status** | ✅ Nav item in dashboard, ⏳ backend not implemented |

#### 7.5.1 Key Capabilities

| Capability | Traditional Approach | Nestopia CS Agent OUTPUT |
|-----------|---------------------|--------------------------|
| Smart Response | Manual message replies | 7×24 AI auto-reply to inquiries; complex issues auto-escalate to human + provide reply suggestions |
| Follow-up Reminders | Excel records + alarms | AI identifies "needs follow-up" customers → generates tasks → push reminders → provide script suggestions |
| Satisfaction Management | Post-project questionnaire | AI contacts customers at key project milestones → identifies dissatisfaction signals → early warning + recovery advice |
| Repurchase Mining | Wait for customer to contact | AI analyzes customer data → identifies "likely needs other products" signals → auto-generate recommendation proposals |
| Referral Drive | Verbally ask for referrals | AI identifies "satisfied customers" → auto-generate referral invitations → provide reward program |
| Emotional Intelligence | Communicate by gut feeling | AI analyzes customer tone/wording → identifies emotional state → prompts "customer may be anxious, suggest reassurance" |
| Customer Profiles | Remember in your head | AI auto-builds customer files (preferences, budget, family situation) → auto-prompt key info for every interaction |

#### 7.5.2 Use Scenarios

- **Scene A: Lead Conversion** — Prospect inquires at midnight → AI instantly replies → books daytime visit → partner sees scheduled calendar in the morning
- **Scene B: Project Follow-up** — AI reminds "Customer X's delivery arriving tomorrow, suggest proactive contact today" → partner one-click confirms → AI auto-sends message
- **Scene C: Repurchase Activation** — AI discovers "Customer Y installed sunroom last year, may now consider a pergola" → auto-generates pergola proposal → partner one-click sends → customer delighted
- **Scene D: Crisis Recovery** — AI detects dissatisfaction in customer message → immediate alert + suggests "apologize first, explain second, compensate last" → partner responds quickly

#### 7.5.3 Fine-tune Training Strategy

| Data Source | Target Volume | Purpose |
|------------|---------------|---------|
| Real customer conversations | 1,000,000+ | Train intent recognition and sentiment analysis |
| Industry script library | Outdoor living specific | Professional terminology, common Q&A, best replies |
| Customer journey model | Full lifecycle | Consultation → Design → Sign → Production → Install → After-sale touchpoints |
| Repurchase prediction | Customer features + behavior | Predict repurchase probability and timing |

**Competitive Moat**: Only Nestopia owns "outdoor living industry full-lifecycle" customer interaction data — generic CS AI cannot understand industry-specific scenarios and customer psychology.

---

### 7.6 Agent 5: Knowledge Base Builder — "智识引擎" (Intelligence Engine)

**Core OUTPUT**: Build and maintain proprietary domain knowledge that powers all other AI agents with industry-specific intelligence

| Dimension | Detail |
|-----------|--------|
| **Market Positioning** | From "document storage" to "intelligence engine" |
| **Key Differentiator** | Structured ingestion of private company data (PDFs, videos, images, docs) into a RAG-ready knowledge base that continuously improves all 4 other agents |
| **Current Status** | ✅ UI built in company-operations.html, ⏳ backend not implemented |

#### 7.6.1 Key Capabilities

| Capability | Traditional Approach | Nestopia KB Builder OUTPUT |
|-----------|---------------------|---------------------------|
| Document Ingestion | File server / SharePoint | Drag-drop upload → auto-categorize → chunk → embed → index → instantly queryable |
| Multi-format Support | PDF reader per file type | PDF, DOCX, XLSX, PPTX, images (OCR), videos (transcript extraction) |
| 6-Category Organization | Flat folder structure | Installation / Compliance / Sales / Design / Training / After-Sales — each feeds relevant agents |
| Agent Routing | Manual copy-paste | Each document tagged to specific agents (Designer, Pricing, Compliance, CS) → auto-routed for RAG |
| Semantic Search | Keyword search only | Vector embeddings → semantic search across all documents |
| Status Tracking | Unknown if indexed | Processing → Indexed status per document with version control |

#### 7.6.2 Document Categories & Agent Mapping

| Category | Content Types | Primary Agents |
|----------|--------------|----------------|
| Installation | Manuals, specs, engineering drawings, supplier catalogs | AI Designer, Compliance Manager |
| Compliance | Building codes, HOA guidelines, permit templates, state regulations | Compliance Manager |
| Sales | Pitch decks, pricing guides, competitor analysis, objection playbooks | Pricing Controller, CS Executive |
| Design | Style guides, color palettes, brand guidelines, photography standards | AI Designer |
| Training | Onboarding guides, training decks, FAQ libraries, process docs | CS Executive |
| After-Sales | Warranty policies, maintenance guides, troubleshooting, SOP | CS Executive |

#### 7.6.3 Use Scenarios

- **Scene A: New Product Launch** — Upload product spec PDF → AI auto-extracts features, dimensions, installation steps → immediately available to Designer and CS agents for accurate responses
- **Scene B: Regulation Update** — New state building code released → upload PDF → Compliance Manager agent auto-updated with latest requirements
- **Scene C: Sales Enablement** — Upload competitor pricing analysis → Pricing Controller agent gains market intelligence for smarter quotation
- **Scene D: Knowledge Audit** — View all indexed documents by category → identify gaps → prioritize uploads to improve agent accuracy

#### 7.6.4 Fine-tune Training Strategy

| Data Source | Target Volume | Purpose |
|------------|---------------|---------|
| Company internal documents | All available docs | Proprietary knowledge unavailable to generic AI |
| Product specifications | Per product line | Accurate technical responses |
| Regional compliance docs | Per state/county | Hyper-local regulatory accuracy |
| Historical Q&A logs | Ongoing | Continuously improve response quality |

**Competitive Moat**: The Knowledge Base Builder transforms private company IP into AI-queryable intelligence — creating a unique, non-replicable knowledge advantage that improves over time as more documents are added.

---

### 7.7 Agent Co-working Model: The "Super Team" for Small Enterprise Owners

#### 7.7.1 Typical Workday Flow

| Time | What Happens |
|------|-------------|
| **8:00 AM** | Open Dashboard → CS Agent reports: "3 follow-up tasks today, 1 customer showing dissatisfaction — needs attention" → one-click confirm |
| **10:00 AM** | Visit customer → photo the yard → AI Designer renders in 30 sec → customer selects option → Pricing Agent instant quotes → sign on the spot |
| **2:00 PM** | New order starts → Compliance Agent auto-scans regulations → discovers HOA approval needed → AI generates application materials → one-click submit |
| **8:00 PM** | Customer inquires online → CS Agent auto-replies → books morning visit → partner sees ready schedule next day |

**Result**: Small enterprise owners go from "exhausted juggling everything" to "commanding with confidence" — 4 agents become tireless super partners.

#### 7.7.2 Cross-Agent Collaboration

| Scenario | Agents Involved | Workflow |
|----------|-----------------|----------|
| New Deal | Designer + Pricing + Compliance | Design render → instant quote → pre-check compliance → complete proposal package |
| Project Execution | CS + Compliance | Auto follow-up → milestone notifications → risk monitoring |
| Customer Retention | CS + Designer | Identify repurchase signal → auto-generate new product proposal → one-click send |

---

### 7.8 Platform IP Building: Fine-tune Roadmap

#### 7.8.1 Data Flywheel

```
More Users → More Data → Better Models → Better Experience → More Users
```

Every interaction feeds back into the training pipeline:
- Every AI Designer render → feedback (did customer sign?) → improve model
- Every quote → deal result + actual cost → train better pricing
- Every compliance check → actual approval result → refine regulation knowledge
- Every customer interaction → satisfaction + repurchase → train smarter CS Agent

#### 7.8.2 Fine-tune Priority

| Agent | Priority | Data Requirement | Expected Impact |
|-------|----------|------------------|-----------------|
| AI Designer | **P0 Highest** | 100K+ yard scene photos | Scene fusion quality surpasses generic AI |
| Pricing Agent | **P1 High** | 500K+ quote-to-close data | Quote win-rate +30% |
| CS Executive | **P1 High** | 1M+ customer conversations | Customer satisfaction 95%+ |
| Compliance Manager | **P2 Medium** | Regulation DB + case library | Compliance accuracy 99%+ |
| Knowledge Base Builder | **P1 High** | All internal company documents | Foundation layer that feeds all other agents |

#### 7.8.3 Competitive Moat Summary

| Moat Type | Description |
|-----------|-------------|
| **Data Moat** | Industry-specific training data that generic AI platforms cannot replicate |
| **Industry Depth** | Generic AI cannot understand "outdoor living customization" nuanced scenarios |
| **Network Effect** | More partners → more regional pricing/regulation data → higher value for new partners |
| **Workflow Integration** | Seamless measure → design → quote → sign pipeline impossible for point solutions to match |

---

## 8. Product Roadmap

### Phase I — Public Website & Partner Portal (Current) ✅
- [x] Homepage with product showcase and contact form
- [x] AI chatbot (Qwen integration)
- [x] Partner Program page with registration
- [x] Login page (multi-tenant aware)
- [x] Dashboard with overview and workflow
- [x] Team management page
- [x] Database schema design (Supabase)
- [x] Edge Functions design (auth, tenant config)
- [x] Cloudflare Pages deployment pipeline
- [x] AI Agent strategy & specification document

### Phase I+ — C-end Content Expansion (Short-term)
- [ ] Create 4 product detail pages (sunroom / ADU / pergola / zip blinds)
- [ ] Create brand strength / about page
- [ ] Add 6-step AI process showcase on homepage (C-end simplified version)
- [ ] Add ADU as 4th product category on homepage
- [ ] Add floating quick-entry buttons (Book Design / View Cases / Chat)
- [ ] Align navigation to 8-item structure

### Phase II — Backend Integration & AI Agents (Next)
- [ ] Provision Supabase Cloud instance
- [ ] Connect login/registration to real Supabase Auth
- [ ] **AI Designer Agent — P0**
  - [ ] Photo upload + auto-dimension extraction
  - [ ] Scene fusion rendering (product into real yard)
  - [ ] Instant variant generation (color/style/material)
  - [ ] One-click proposal export (PDF with design + quote)
  - [ ] Digital measurement partner SDK integration (future)
- [ ] **Pricing & Cost Controller Agent — P1**
  - [ ] 3-tier auto-quotation engine (Basic/Standard/Premium)
  - [ ] Real-time profit margin monitoring + alerts
  - [ ] Material cost tracking (supplier API integration)
  - [ ] Hidden cost auto-calculation (transport, tax, installation)
- [ ] Build real project/order CRUD in dashboard
- [ ] File upload for design tool (backyard photos)
- [ ] Payment integration

### Phase III — Advanced Agents & Growth (Future)
- [ ] **Customer Service Executive Agent — P1**
  - [ ] 7×24 AI auto-response with smart escalation
  - [ ] Proactive follow-up task generation
  - [ ] Satisfaction milestone tracking + churn prevention
  - [ ] Repurchase signal detection + auto-proposal
  - [ ] Emotional intelligence analysis
  - [ ] Customer profile auto-building
- [ ] **Compliance Manager Agent — P2**
  - [ ] Regulation pre-check by project address
  - [ ] Permit application roadmap generation
  - [ ] Application form auto-fill
  - [ ] Risk radar (pre-project scanning)
  - [ ] Regulation update monitoring
- [ ] Cross-agent collaboration workflows
- [ ] Advanced analytics and reporting
- [ ] Custom domain support per tenant
- [ ] Digital marketing tools
- [ ] Mobile app consideration

### Phase IV — Platform IP & Scale
- [ ] Fine-tune AI Designer model (100K+ yard scene data)
- [ ] Fine-tune Pricing model (500K+ quote data)
- [ ] Fine-tune CS model (1M+ conversation data)
- [ ] Build Compliance regulation knowledge graph
- [ ] Digital measurement partner deep integration (SDK + API + co-branded certification)
- [ ] Data flywheel optimization
- [ ] Enterprise-tier offering (custom models + API access)

---

## 9. Design System

### 9.1 Color Scheme
The site uses a consistent **Black/Gray/White** theme across all pages.

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#222222` | Primary text, buttons, accents |
| `--primary-dark` | `#111111` | Darker variant |
| `--secondary` | `#888888` | Secondary text |
| `--accent` | `#555555` | Accent elements |
| `--light-text` | `#1a1a1a` | Body text |
| `--light-accent` | `#666666` | Subtle text |
| `--darker-bg` | `#f5f5f5` | Section backgrounds |
| `--success` | `#10b981` | Success states |

### 9.2 Typography
- **Font**: Roboto (Google Fonts) with system-ui fallback
- **Weights**: 300 (light), 400 (regular), 500 (medium), 700 (bold)

### 9.3 Key Design Decisions
- No dark mode toggle (not a priority)
- Bilingual support via `lang-text` class with `data-zh` / `data-en` attributes
- Responsive breakpoints: mobile-first, md (768px), lg (1024px)

---

## 10. Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Build scripts, dependencies (Vite, React, Tailwind, Wrangler) |
| `_routes.json` | Cloudflare Pages routing — excludes static HTML from SPA fallback |
| `_redirects` | Cloudflare redirect rules (200 status for HTML pages) |
| `_headers` | Cache control (no-cache for HTML), security headers |
| `vercel.json` | Vercel deployment config (alternative deployment target) |
| `supabase/config.toml` | Supabase project configuration |
| `supabase/.env.example` | Environment variables template |

---

## 11. Image Assets (~40 files)

```
public/images/
├── hero/               # 3 hero carousel images
├── gallery/            # 6 product gallery images
├── products/
│   ├── sunroom/        # 9 images (3 hero + 6 gallery)
│   ├── pergola/       # 9 images (3 hero + 6 gallery)
│   └── windproof/      # 9 images (3 hero + 6 gallery)
├── hero-bg.jpg         # Homepage background
├── interior.jpg        # Interior page image
└── partner-logo.png    # Generated test partner logo (Greenscape Builders)
```

---

## 12. Known Issues & Technical Debt

| Issue | Description | Priority |
|-------|-------------|----------|
| Mock Auth | Login uses mock JWT tokens, not connected to Supabase | P0 |
| Mock Data | Dashboard stats/projects/activity are hardcoded | P1 |
| `database/` folder | Legacy schema, superseded by `supabase/schema.sql` — should be removed | P2 |
| Chinese remnants | Some `data-zh` attributes still visible in English mode on certain pages | P2 |
| AI Design Tool stubs | Upload/generate functions are placeholder only | P1 |
| Agent pages | Clicking agent nav items falls back to Overview (no dedicated pages) | P1 |
| Missing product pages | No independent pages for sunroom/ADU/pergola/zip blinds | P1 |
| Missing case library | No project showcase / case study section | P1 |
| Missing brand page | No about us / brand strength page | P2 |

---

## 13. Documentation Artifacts

| Document | Location | Description |
|----------|----------|-------------|
| REQUIREMENTS.md | `docs/` | This document — project specification (v6.0.0) |
| AI_Agents_Strategy_Whitepaper.md | `docs/` | Five AI Agent strategy, fine-tune roadmap, co-working model, competitive moat analysis |
| DATA_AI_STRATEGY.md | `docs/` | Data + AI architecture, knowledge base design, lakehouse pattern |
| PRODUCT_DEMO.md | `docs/` | Product demo script (v3.0.0) |
| AI_Designer_Agent_Spec.md | `docs/` | AI Designer detailed spec |
| Pricing_Cost_Controller_Agent_Spec.md | `docs/` | Pricing Agent detailed spec |
| Compliance_Manager_Agent_Spec.md | `docs/` | Compliance Manager detailed spec |
| Customer_Service_Executive_Agent_Spec.md | `docs/` | CS Executive detailed spec |
| AI_Designer_Feasibility_Study.docx | `docs/` | Market feasibility, use cases, UX design, technical feasibility, partnership strategy |
| US_Regional_Compliance_Requirements.docx | `docs/` | US federal/state/local building codes, HOA requirements, Compliance Manager specs |
| Gap_Analysis_Report.docx | `docs/` | Third-party proposal vs current implementation analysis |
| 文案方案分析报告.docx | `docs/` | Chinese market proposal analysis |
| business-workflow.md | `docs/` | 15-step business workflow documentation |
| multi-tenant-architecture.md | `docs/` | Multi-tenant architecture design |
| AI_PLATFORM_ARCHITECTURE.md | Root | AI platform architecture overview |
| DATABASE_SCHEMA.md | Root | Database schema documentation |
| DESIGN_TOOL_API.md | Root | Design tool API specification |
| LLM_API_DESIGN.md | Root | LLM API integration design |
| PAYMENT_SOLUTION.md | Root | Payment solution design |
| UX_DESIGN.md | Root | UX design specification |

---

## 14. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-30 | Initial version, MVP homepage | websterzhangsh |
| 1.0.1 | 2026-01-30 | Add chatbot | websterzhangsh |
| 2.0.0 | 2026-01-30 | Full project documentation | websterzhangsh |
| 2.1.0 | 2026-02-02 | Database schema, API design docs | websterzhangsh |
| 2.2.0 | 2026-03-03 | AI platform architecture doc | websterzhangsh |
| 2.3.0 | 2026-03-09 | Multi-tenant architecture, business workflow docs | websterzhangsh |
| 3.0.0 | 2026-03-11 | Reverse-engineered requirements reflecting actual implementation | websterzhangsh |
| 4.0.0 | 2026-03-11 | Major update: Integrated AI Agent strategy (OUTPUT > HOW philosophy, 4 agent detailed specs, fine-tune roadmap, co-working model, digital measurement partnership, platform IP strategy); Added comprehensive US regional compliance requirements (IRC, CA/FL/TX specifics, HOA coverage); Added Phase I+/IV to roadmap; Moved to docs/ folder; Added documentation artifacts inventory | websterzhangsh |
| 6.0.0 | 2026-03-12 | Added Agent 5: Knowledge Base Builder ("智识引擎"); updated agent count from 4 to 5; added Section 7.6 with full spec (capabilities, document categories, agent mapping, use scenarios, fine-tune strategy); updated fine-tune priority table; renumbered sections 7.6→7.7, 7.7→7.8 | websterzhangsh |

---

*This document reflects the actual implemented state + strategic direction of the system as of 2026-03-11.*  
*It will be updated as new features are built.*
