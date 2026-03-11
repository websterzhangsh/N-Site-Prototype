# N-Site-Prototype Requirements Specification
# Nestopia Platform 需求规格说明书

**Project Name**: Nestopia Platform (N-Site-Prototype)  
**Version**: 3.0.0  
**Last Updated**: 2026-03-11  
**Maintainer**: websterzhangsh  
**Live URL**: https://n-site-prototype.pages.dev  
**Repository**: https://github.com/websterzhangsh/N-Site-Prototype

---

## 1. Project Overview

### 1.1 Background
Nestopia is a B2B platform for outdoor living products — sunrooms, pavilions, and zip blinds. The platform serves as a public-facing product showcase, a partner registration and management portal, and a multi-tenant dashboard for partner companies.

### 1.2 Project Goals
- Public website for product showcase and customer lead generation
- B2B Partner Program with registration and sign-in
- Multi-tenant dashboard for partner companies (projects, orders, workflow, AI agents)
- AI-powered design tools and customer service (planned)
- Supabase-backed authentication, database, and edge functions

### 1.3 Target Users

| User Type | Description |
|-----------|-------------|
| End Customers | Homeowners browsing products and submitting design consultation requests |
| Partners (B2B) | Contractors, landscape designers, architects, real estate agents — registered companies using the platform |
| Partner Admins | Admin users within a partner tenant, managing team, projects, orders |
| Platform Admin | Internal Nestopia staff (future) |

### 1.4 Development Methodology
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
| Version Control | Git + GitHub |

### 2.2 Site Architecture (Multi-Page Static)

```
index.html          → Homepage (product showcase, contact form, chatbot)
partners.html       → Partner Program page (features, registration form)
login.html          → Partner sign-in (multi-tenant aware)
dashboard.html      → Partner dashboard (overview, workflow, agents)
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
├── dashboard.html              # Partner dashboard
├── team-management.html        # Team management
├── package.json                # Build config
├── _routes.json                # Cloudflare routing
├── _redirects                  # Cloudflare redirects
├── _headers                    # Cloudflare HTTP headers
├── public/images/              # Static image assets (~40 images)
│   ├── hero/                   # Hero carousel images
│   ├── gallery/                # Gallery images
│   ├── products/               # Product images (sunroom, pavilion, windproof)
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
└── docs/                       # Architecture documentation
```

---

## 3. Implemented Features

### 3.1 Homepage (`index.html`) — ✅ Complete

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-001 | Responsive Layout | Mobile-first design, adapts to all screen sizes | ✅ |
| FR-002 | Navigation | Sticky header with smooth scroll to sections | ✅ |
| FR-003 | Hero Carousel | 3-slide auto-rotating product showcase | ✅ |
| FR-004 | Product Showcase | 3 product categories: Sunroom, Pavilion, Zip Blinds | ✅ |
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

### 3.4 Dashboard (`dashboard.html`) — ✅ Structural Complete

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
| FR-059 | AI Agents (sidebar) | 4 agent nav items: AI Designer, Pricing & Cost Controller, Compliance Manager, Customer Service Executive | ✅ UI only |

### 3.5 Team Management (`team-management.html`) — ✅ Basic

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| FR-060 | Team List | Employee list display | ✅ |
| FR-061 | Add/Remove Members | Basic team member management | ✅ |

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

---

## 5. Database Schema (Supabase PostgreSQL)

Located in `supabase/schema.sql`. Multi-tenant architecture with RLS.

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenants` | Partner companies | slug, name, status, plan, ui_config (JSONB), feature flags, quotas |
| `users` | All users across tenants | email, password_hash, role (super_admin/admin/manager/member), tenant_id |
| `user_sessions` | JWT session management | token, refresh_token, ip_address, user_agent, expires_at |
| `audit_logs` | Activity tracking | action, resource_type, old_values, new_values |
| `projects` | Client projects | title, type (sunroom/pavilion/shutter), status, budget, timeline |
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

## 7. AI Agents (Planned)

Four AI agents are shown in the Dashboard sidebar. Currently UI-only with no backend implementation.

| Agent | Purpose | Status |
|-------|---------|--------|
| AI Designer | Generate design renderings from client photos + product images | ⏳ UI stub in workflow Step 4 |
| Pricing and Cost Controller | Automated quotation and cost optimization | ⏳ Nav item only |
| Compliance Manager | Permit tracking, code compliance checking | ⏳ Nav item only |
| Customer Service Executive | AI-powered customer communication | ⏳ Nav item only |

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

### Phase II — Backend Integration & AI Agents (Next)
- [ ] Provision Supabase Cloud instance
- [ ] Connect login/registration to real Supabase Auth
- [ ] Implement AI Designer agent (image generation API)
- [ ] Implement Pricing and Cost Controller agent
- [ ] Build real project/order CRUD in dashboard
- [ ] File upload for design tool (backyard photos)
- [ ] Payment integration

### Phase III — Advanced Features (Future)
- [ ] Compliance Manager agent
- [ ] Customer Service Executive agent
- [ ] Advanced analytics and reporting
- [ ] Custom domain support per tenant
- [ ] Digital marketing tools
- [ ] Mobile app consideration

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
│   ├── pavilion/       # 9 images (3 hero + 6 gallery)
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

---

## 13. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-30 | Initial version, MVP homepage | websterzhangsh |
| 1.0.1 | 2026-01-30 | Add chatbot | websterzhangsh |
| 2.0.0 | 2026-01-30 | Full project documentation | websterzhangsh |
| 2.1.0 | 2026-02-02 | Database schema, API design docs | websterzhangsh |
| 2.2.0 | 2026-03-03 | AI platform architecture doc | websterzhangsh |
| 2.3.0 | 2026-03-09 | Multi-tenant architecture, business workflow docs | websterzhangsh |
| 3.0.0 | 2026-03-11 | Reverse-engineered requirements update reflecting actual implementation: Partners page with registration, login, dashboard with workflow timeline, 4 AI agents, Supabase schema, Cloudflare Pages deployment | websterzhangsh |

---

*This document reflects the actual implemented state of the system as of 2026-03-11.*  
*It will be updated as new features are built.*
