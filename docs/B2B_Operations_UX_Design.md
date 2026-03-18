# Nestopia B2B Operations Platform - UX Design Document
**Version**: 1.0.0
**Last Updated**: 2026-03-18
**Status**: Living Document - Continuously Evolving
**Scope**: Company Operations Dashboard (company-operations.html)

---

## 1. Product Overview

### 1.1 Platform Purpose
The Nestopia B2B Operations Platform serves as the internal command center for managing the full lifecycle of outdoor living projects — from initial customer intent through installation and post-sale support. It integrates project management, AI-powered design tools, compliance workflows, and business intelligence into a unified dashboard.

### 1.2 Target Users

| Role | Description | Primary Tasks | Frequency |
|------|-------------|---------------|-----------|
| **Operations Admin** | Day-to-day business manager | Monitor KPIs, manage orders, oversee projects | Daily |
| **Project Manager** | Oversees individual project delivery | Track workflow steps, manage risks/issues, coordinate teams | Daily |
| **Sales Representative** | Handles customer inquiries & conversions | View customers, create quotes, track orders | Daily |
| **Designer** | Uses AI tools for concept & detail design | Generate designs, review measurements, prepare renderings | Per project |
| **Compliance Officer** | Ensures regulatory requirements are met | Review permits, HOA approvals, inspection reports | Per project |
| **Company Owner / Exec** | Strategic oversight | Revenue dashboards, team performance, portfolio health | Weekly |

### 1.3 Design Principles
```
Clarity > Density > Beauty > Animation
```
- **Clarity**: Every screen answers "What should I do next?"
- **Density**: Show enough data without overwhelming; progressive disclosure
- **Beauty**: Professional, premium aesthetic aligned with Nestopia brand
- **Animation**: Purposeful transitions, never decorative

### 1.4 Design System Reference
- Color palette: `#222222` (primary dark), `#f5f5f5` (background), semantic colors for status
- Typography: Roboto 400/500/600/700
- Spacing: 4px base unit (Tailwind scale)
- Border radius: 8px (cards), 12px (modals), full (badges)
- See `UI_DESIGN_SYSTEM.md` for full token reference

---

## 2. Information Architecture

### 2.1 Site Map

```
Company Operations Dashboard
├── MAIN MENU
│   ├── Company Overview (default landing)
│   │   ├── Orders Summary Card → Expandable Orders Table
│   │   ├── Customers Summary Card → Expandable Customers Table
│   │   ├── Products Summary Card → Expandable Products Grid
│   │   └── Revenue Summary Card (static with trend chart)
│   │
│   └── Projects (master-detail layout)
│       ├── [Left Panel] Project List (searchable, filterable)
│       └── [Right Panel] Project Detail
│           ├── Service Workflow (6-step tracker)
│           ├── Risk List
│           ├── Issue List
│           ├── Customer Info
│           ├── Order Info
│           └── Revenue / Payment Progress
│
├── AGENTS
│   ├── AI Designer
│   │   ├── Project Selection
│   │   ├── Photo Upload (site + reference)
│   │   ├── AI Design Generation
│   │   ├── Design Preview (before/after)
│   │   └── Variant Selection
│   │
│   ├── Pricing and Cost Controller
│   │   ├── Product Configuration
│   │   ├── Cost Breakdown
│   │   ├── Margin Analysis
│   │   └── Quote Generation
│   │
│   ├── Compliance Manager
│   │   ├── Project Selection
│   │   ├── Jurisdiction & Code Lookup
│   │   ├── Compliance Checklist
│   │   └── Document Package Generation
│   │
│   ├── Customer Service Executive
│   │   ├── Ticket Queue
│   │   ├── Customer Communication
│   │   ├── FAQ / Knowledge Retrieval
│   │   └── Escalation Workflow
│   │
│   └── Knowledge Base Builder
│       ├── Document Upload & Indexing
│       ├── Tag Management
│       ├── Search & Retrieval
│       └── Training Data Curation
│
└── SETTINGS
    ├── Team Management
    │   ├── Member List (table view)
    │   ├── Role Assignment
    │   └── Performance Overview
    │
    └── System Settings
        ├── Company Profile
        ├── Integrations
        ├── Notifications
        └── Billing
```

### 2.2 Navigation Model

| Level | Component | Behavior |
|-------|-----------|----------|
| **L1 - Sidebar** | Fixed left sidebar (260px) | Always visible; collapsible on mobile |
| **L2 - Page Content** | Right main area | Switches via sidebar nav click |
| **L3 - In-Page Sections** | Cards, panels, tabs | Click-to-expand (Overview), master-detail (Projects), tabs (Settings) |

---

## 3. Page-by-Page UX Specifications

### 3.1 Company Overview

#### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Orders Card]  [Customers Card]  [Products Card]  [Revenue Card] │
│   156 total       482 total        24 total        $128K/mo       │
│   clickable ▼     clickable ▼      clickable ▼     static chart   │
├──────────────────────────────────────────────────────┤
│  ┌─────────── Expandable Detail Section ──────────┐  │
│  │  (Shows when a card above is clicked)           │  │
│  │  Orders → table with search/filter              │  │
│  │  Customers → table with search/filter/badges    │  │
│  │  Products → card grid with category filters     │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### Interaction Design

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click summary card | Expand detail section below; highlight card border | Smooth slide-down (200ms), border color change |
| Click same card again | Collapse detail section | Slide-up, border revert |
| Click different card | Switch detail section | Cross-fade |
| Revenue card | Non-clickable; shows mini bar chart trend | Static |

#### Card States
- **Default**: `border-gray-200`, subtle hover shadow
- **Active/Expanded**: `border-{color}-400`, elevated shadow, arrow rotated 180deg
- **Hover**: `border-{color}-400` hint, slight shadow lift

#### Data Density Guidelines
- Summary cards: 1 primary metric + 2 secondary stats
- Orders table: 6 columns max (ID, Customer, Product, Total, Status, Date)
- Customers table: 6 columns (Name, Email, Location, Projects, Spent, Status)
- Products grid: Card layout with icon, name, category, price, status badge

#### Future Enhancements (Planned)
- [ ] Revenue card click → detailed revenue breakdown (charts, MoM comparison)
- [ ] Quick-action buttons on tables (View, Edit, Export)
- [ ] Real-time data via Supabase subscription
- [ ] Date range filter for all sections
- [ ] Drag-to-reorder cards based on user preference

---

### 3.2 Projects (Master-Detail)

#### Layout
```
┌────────────────┬──────────────────────────────────────┐
│  Left Panel    │  Right Panel - Project Detail          │
│  (320px fixed) │  (flex-1, scrollable)                  │
│                │                                        │
│  [Search...]   │  Project Name          [Risk Badge]    │
│  [All][Active] │  Customer · Type · Budget              │
│  [Done]        │                                        │
│                │  ┌─ Service Workflow ────────────────┐  │
│  ● PRJ-001 ◄  │  │  ✓ Intent → ✓ Design → ■ Meas…  │  │
│    Johnson     │  └──────────────────────────────────┘  │
│    Step 3/6    │                                        │
│                │  ┌─ Risk List ───────────────────────┐  │
│  ○ PRJ-002     │  │  ● Permit delayed     [high]     │  │
│    Martinez    │  │  ● HOA review pending  [medium]   │  │
│    Step 2/6    │  └──────────────────────────────────┘  │
│                │                                        │
│  ○ PRJ-003     │  ┌─ Issue List ─────────────────────┐  │
│    Smith       │  │  ● Permit approval delayed       │  │
│    Step 5/6    │  │  ● HOA docs incomplete           │  │
│                │  └──────────────────────────────────┘  │
│  ...           │                                        │
│                │  ┌─ Customer ───────────────────────┐  │
│                │  │  [Avatar] Name / Email / Phone    │  │
│                │  └──────────────────────────────────┘  │
│                │                                        │
│                │  ┌─ Order ──────────────────────────┐  │
│                │  │  ORD-xxxx / Product / Total       │  │
│                │  └──────────────────────────────────┘  │
│                │                                        │
│                │  ┌─ Revenue ────────────────────────┐  │
│                │  │  Budget: $35K  Collected: $18.5K  │  │
│                │  │  [████████░░░░] 53%               │  │
│                │  └──────────────────────────────────┘  │
└────────────────┴──────────────────────────────────────┘
```

#### Left Panel - Project List

| Element | Specification |
|---------|---------------|
| Search input | Full-width, icon prefix, debounced 300ms |
| Filter chips | All / Active / Done — pill buttons, single-select |
| Project item | Name (bold), customer · type (gray), progress bar + step label |
| Risk indicator | Colored dot (red/amber/green) top-right of each item |
| Selected state | Blue-50 background + left blue border (4px) |
| Empty state | Centered icon + "No projects found" message |

#### Right Panel - Project Detail

| Section | Content | Interaction |
|---------|---------|-------------|
| **Header** | Project name, metadata line, risk badge | Static display |
| **Service Workflow** | 6-step horizontal pipeline | Visual only (no click action yet) |
| **Risk List** | Severity dot + title + badges | Expandable rows (future) |
| **Issue List** | Priority dot + title + assignee + status badge | Click to open issue detail (future) |
| **Customer** | Avatar + 2x2 info grid (name, email, phone, address) | Click to open full customer profile (future) |
| **Order** | 4-column grid (ID, product, total, status) | Click to open order detail (future) |
| **Revenue** | Budget / Collected / Remaining + progress bar | Static display |

#### Empty State (no project selected)
- Large folder icon (text-5xl, gray-400)
- "Select a project" heading
- "Choose a project from the list to view details" subtext
- Centered vertically in the panel

#### Future Enhancements (Planned)
- [ ] Service Workflow step click → expand step detail with document uploads & checklist
- [ ] Inline issue creation from Issue List section
- [ ] Risk severity editing (click to change level)
- [ ] Customer profile deep-link
- [ ] Order payment tracking with milestone markers
- [ ] Project timeline / Gantt view option
- [ ] Bulk actions on project list (assign, archive)
- [ ] Project creation wizard (multi-step form)

---

### 3.3 AI Designer Agent

#### User Flow
```
1. Select Project → 2. Upload Site Photo → 3. Configure Style →
4. Generate Design → 5. Preview & Compare → 6. Select Variant → 7. Export/Save
```

#### Layout
```
┌──────────────────┬──────────────────────────────┐
│  Left Column     │  Right Column                  │
│  (Form inputs)   │  (Visual output)               │
│                  │                                 │
│  1. Select Proj  │  ┌─ Design Preview ──────────┐  │
│  [Dropdown]      │  │                            │  │
│  Client, Address │  │    AI-Generated            │  │
│  Yard Size, etc  │  │    Rendering               │  │
│                  │  │                            │  │
│  2. Upload Photo │  └────────────────────────────┘  │
│  [Drop zone]     │                                 │
│                  │  ┌─ Before/After Toggle ──────┐  │
│  3. Style Config │  │  [Before] [After]          │  │
│  [Options]       │  └────────────────────────────┘  │
│                  │                                 │
│  [Generate]      │  Variants: [1] [2] [3] [+More]  │
└──────────────────┴──────────────────────────────────┘
```

#### Key UX Decisions
- Photo upload supports drag-and-drop + file picker
- AI generation shows loading skeleton with estimated time
- Before/After comparison uses slider overlay
- Variants displayed as thumbnail strip below main preview
- "Generate More" button for additional variations

#### Future Enhancements (Planned)
- [ ] Real-time AI generation progress indicator
- [ ] Style transfer from reference photos
- [ ] Material/color customization on generated designs
- [ ] Direct export to measurement phase (Step 3)
- [ ] Customer-facing design sharing link

---

### 3.4 Pricing and Cost Controller Agent

#### Layout
```
┌──────────────────┬──────────────────────────────┐
│  Configuration   │  Cost Breakdown & Quote        │
│                  │                                 │
│  Product Type    │  ┌─ Cost Structure ───────────┐ │
│  Dimensions      │  │  Materials:    $12,500     │ │
│  Materials       │  │  Labor:        $4,200      │ │
│  Add-ons         │  │  Permits:      $800        │ │
│                  │  │  Overhead:     $2,100      │ │
│  [Calculate]     │  │  ─────────────────────     │ │
│                  │  │  Total Cost:   $19,600     │ │
│                  │  │  Margin (35%): $10,545     │ │
│                  │  │  QUOTE:        $30,145     │ │
│                  │  └────────────────────────────┘ │
│                  │                                 │
│                  │  [Generate Quote PDF]            │
└──────────────────┴──────────────────────────────────┘
```

#### Future Enhancements (Planned)
- [ ] Historical pricing comparison
- [ ] Competitor price benchmarking
- [ ] Volume discount calculator
- [ ] Multi-currency support
- [ ] Quote version history & approval workflow

---

### 3.5 Compliance Manager Agent

#### Layout
```
┌──────────────────┬──────────────────────────────┐
│  Project & Specs │  Compliance Status              │
│                  │                                 │
│  1. Select Proj  │  Overall: 85% ████████░░        │
│  [Dropdown]      │                                 │
│                  │  Federal: IRC 2024 / IBC / IECC │
│  2. Specs        │   ✓ Egress requirements met     │
│  Structure Size  │   ✓ Energy efficiency (ECC)     │
│  Height (ft)     │   ⚠ Structural load review      │
│  ...             │                                 │
│                  │  State: California Building Code │
│                  │   ✓ Seismic zone compliance      │
│                  │   ✗ Solar access ordinance        │
│                  │                                 │
│  [Run Check]     │  HOA: Sunshine Hills HOA         │
│                  │   ⚠ Design review needed          │
│                  │                                 │
│                  │  [Generate Compliance Package]    │
└──────────────────┴──────────────────────────────────┘
```

#### Future Enhancements (Planned)
- [ ] Auto-detect jurisdiction from project address
- [ ] Permit application auto-fill
- [ ] Code update notifications (building code changes)
- [ ] Integration with local government permit portals

---

### 3.6 Customer Service Executive Agent

#### Layout
- Left sidebar: ticket queue with priority indicators
- Center: active conversation thread
- Right panel: customer context (project, order, history)

#### Future Enhancements (Planned)
- [ ] AI-suggested response templates
- [ ] Sentiment analysis on customer messages
- [ ] Automatic ticket routing based on category
- [ ] SLA tracking with visual indicators
- [ ] Customer satisfaction scoring

---

### 3.7 Knowledge Base Builder

#### Layout
- Top: Stats (total docs, indexed, pending, categories)
- Upload modal with drag-drop, tag selection, category assignment
- Document grid with search, filter by tag/category/status
- Preview panel for selected document

#### Future Enhancements (Planned)
- [ ] Bulk upload with auto-categorization
- [ ] RAG quality scoring per document
- [ ] Version control for updated documents
- [ ] Usage analytics (which docs are retrieved most)

---

## 4. Shared UX Patterns

### 4.1 Navigation
```
┌──────────┬───────────────────────────────────────┐
│ SIDEBAR  │  HEADER (sticky)                       │
│ 260px    │  [Page Title]        [Search][Bell][User] │
│          ├───────────────────────────────────────┤
│ Logo     │                                        │
│ Tenant   │  CONTENT AREA                          │
│          │  (scrollable, 24px padding)            │
│ Nav Items│                                        │
│          │                                        │
│          │                                        │
│          │                                        │
└──────────┴───────────────────────────────────────┘
```

### 4.2 Status Badges
| Status | Color | Use Cases |
|--------|-------|-----------|
| Active / In Progress | `bg-blue-50 text-blue-700` | Orders, projects, issues |
| Pending / Warning | `bg-amber-50 text-amber-700` | Awaiting action |
| Completed / Success | `bg-green-50 text-green-700` | Done, approved, active |
| High Risk / Error | `bg-red-50 text-red-700` | Critical alerts |
| Info / New | `bg-purple-50 text-purple-700` | New items, shipped |
| VIP / Premium | `bg-amber-50 text-amber-700` | Customer tier |

### 4.3 Table Design
- Header: `bg-gray-50/50`, uppercase text-xs, tracking-wider
- Rows: `border-b border-gray-50`, hover `bg-gray-50/50`
- Actions column: icon buttons (ellipsis or specific icons)
- Empty state: centered message with icon
- Loading state: skeleton shimmer rows

### 4.4 Card Design
- Background: white
- Border: `border-gray-200` (1px), `rounded-xl` (12px)
- Padding: `p-5` (20px)
- Hover: `shadow-lg` + border color change
- Section headers inside cards: `bg-gray-50/70`, icon + text, `border-b`

### 4.5 Form Inputs
- Border: `border-gray-200`, `rounded-lg`
- Focus: `ring-2 ring-gray-300` (neutral) or `ring-{color}-300` (contextual)
- Labels: `text-sm font-medium text-gray-700`
- Helper text: `text-xs text-gray-400`
- Error: `border-red-300 ring-red-300`, red helper text

### 4.6 Empty States
All empty states follow this pattern:
```
[Icon - 5xl, gray-400]
[Heading - lg, font-medium]
[Subtext - sm, gray-400]
[Optional CTA button]
```

### 4.7 Loading States
- Skeleton shimmer for initial loads
- Inline spinner for actions (button → loading state)
- Progress bars for multi-step operations

---

## 5. Service Workflow (6-Step) UX Specification

### 5.1 Overview
The 6-step workflow is the backbone of every project. It appears inside the Projects detail panel and drives the entire project lifecycle.

### 5.2 Step Definition

| Step | Name | Icon | Color | Payment Milestone | Key Documents |
|------|------|------|-------|-------------------|---------------|
| 1 | Intent | fa-handshake | blue | $100 Intent Fee | Intent fee receipt, Phase 1 sign-off |
| 2 | Design | fa-palette | indigo | $500-$1K Design Fee | Site photos, AI renderings, design fee receipt, Phase 2 sign-off |
| 3 | Measurement | fa-ruler-combined | purple | — | Measurement report, site plan, elevation drawings, Phase 3 sign-off |
| 4 | Quotation | fa-file-contract | orange | 50% Deposit | Quotation, signed contract, compliance package, Phase 4 sign-off |
| 5 | Production | fa-industry | yellow | 40% Pre-ship | QC report, pre-assembly photos, delivery receipt, Phase 5 sign-off |
| 6 | Installation | fa-tools | green | 10% Final | Installation photos, CO certificate, inspection report, warranty, Phase 6 sign-off |

### 5.3 Workflow Visualization

**Current (v1.0)**: Horizontal pipeline with step circles
```
[✓ Intent] → [✓ Design] → [■ Measurement] → [○ Quotation] → [○ Production] → [○ Installation]
 completed     completed      current            future           future           future
 green-50      green-50      purple-50/border   opacity-40       opacity-40       opacity-40
```

**Planned (v2.0)**: Clickable steps with expandable detail
```
Click on step → Expand below showing:
  - Document uploads (required vs optional, uploaded vs pending)
  - Checklist items (checkbox list)
  - Payment status
  - Customer sign-off status
  - Notes / comments
```

### 5.4 Step 3 Special Note
> **Manual measurement is the PRIMARY method (current).**
> Laser 3D scanning (UNRE/Leica) remains a planned future capability, NOT yet operational.
> Professional tools: measuring tape, laser measure, level, angle finder.

---

## 6. Responsive Design

### 6.1 Breakpoints
| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | ≥1280px | Full layout with sidebar |
| Tablet | 768-1279px | Collapsible sidebar, stacked cards |
| Mobile | <768px | Hidden sidebar (hamburger), single column |

### 6.2 Projects Page Responsive Behavior
- **Desktop**: Side-by-side (320px list + flex detail)
- **Tablet**: Overlay detail panel on project click
- **Mobile**: List view only; project click navigates to full-screen detail

### 6.3 Company Overview Responsive Behavior
- **Desktop**: 4 cards in a row
- **Tablet**: 2x2 grid
- **Mobile**: Single column, stacked cards

---

## 7. Accessibility

### 7.1 Requirements
- WCAG 2.1 Level AA compliance target
- All interactive elements keyboard-navigable
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader labels on all icon-only buttons
- Focus indicators on all interactive elements

### 7.2 Implementation Notes
- All `<button>` and `<a>` elements must have descriptive text or `aria-label`
- Status colors always paired with text labels (not color-only)
- Tables include `<thead>` with semantic headers
- Form inputs have associated `<label>` elements

---

## 8. Evolution Roadmap

### Phase 1 (Current - v1.0) ✅
- [x] Company Overview with clickable summary cards
- [x] Projects master-detail layout
- [x] 6-step workflow visualization in project detail
- [x] Risk/Issue lists per project
- [x] Customer/Order/Revenue sections per project
- [x] 5 AI Agent pages (basic layouts)
- [x] Team Management page
- [x] System Settings page

### Phase 2 (Next - v1.1)
- [ ] Clickable workflow steps with document upload & checklist
- [ ] Project creation wizard (multi-step modal)
- [ ] Inline issue creation & editing
- [ ] Customer profile deep-link from project
- [ ] Real data integration (Supabase backend)
- [ ] File upload with drag-and-drop for all document types
- [ ] Notification center (bell icon functionality)

### Phase 3 (v1.2)
- [ ] AI Designer: real AI integration (DALL-E / Stable Diffusion)
- [ ] Pricing Agent: dynamic cost calculation engine
- [ ] Compliance Agent: jurisdiction database integration
- [ ] Customer Service: ticket system with AI-suggested replies
- [ ] Knowledge Base: RAG integration with document indexing
- [ ] Mobile-responsive layout optimization

### Phase 4 (v2.0)
- [ ] Multi-tenant support (partner/channel company switching)
- [ ] Role-based access control (RBAC) on all pages
- [ ] Advanced analytics dashboard (charts, trends, forecasting)
- [ ] Calendar view for project timelines
- [ ] Gantt chart for project scheduling
- [ ] Email/SMS notification integration
- [ ] Customer-facing portal (project status tracking)
- [ ] API integration with factory ERP systems

---

## 9. Design Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | Merge Orders/Customers/Products into Company Overview | Reduce sidebar clutter; these are summary-level views, not independent workflows |
| 2026-03-18 | Service Workflow moved into Project detail (not standalone) | Workflow is always project-specific; standalone page was redundant |
| 2026-03-18 | Master-detail layout for Projects | Efficient project browsing; reduce page switches; inspired by email client UX |
| 2026-03-18 | Revenue card is static (non-clickable) | Revenue is a KPI indicator; detailed revenue analysis planned for Phase 2 |
| 2026-03-18 | Keep Agents and Settings as separate sidebar sections | Agent pages are complex enough to warrant dedicated views; will be reconstructed later |
| 2026-03-16 | Manual measurement as primary (Step 3) | Laser 3D scanning not yet feasible; manual tools are reliable and proven |

---

## Appendix A: File Upload Types per Workflow Step

### Step 1 - Intent
| Document | Required | Icon |
|----------|----------|------|
| Intent Fee Receipt ($100) | Yes | fa-receipt |
| Phase 1 Customer Sign-off | Yes | fa-signature |

### Step 2 - Design
| Document | Required | Icon |
|----------|----------|------|
| Site Photos (multi-angle) | Yes | fa-camera |
| Style Reference Photos | No | fa-images |
| AI Concept Design Renderings | Yes | fa-paint-brush |
| Design Fee Receipt ($500-$1K) | Yes | fa-receipt |
| Phase 2 Customer Sign-off | Yes | fa-signature |

### Step 3 - Measurement
| Document | Required | Icon |
|----------|----------|------|
| Measurement Report | Yes | fa-ruler |
| Site Plan Drawing | Yes | fa-drafting-compass |
| Schematic Design Renderings | Yes | fa-image |
| Elevation Drawings | Yes | fa-building |
| Structural Calculation | No | fa-calculator |
| Phase 3 Customer Sign-off | Yes | fa-signature |

### Step 4 - Quotation
| Document | Required | Icon |
|----------|----------|------|
| Detailed Quotation | Yes | fa-file-invoice-dollar |
| Signed Contract | Yes | fa-file-contract |
| Deposit Receipt (50%) | Yes | fa-receipt |
| Compliance Package | Yes | fa-shield-alt |
| Phase 4 Customer Sign-off | Yes | fa-signature |

### Step 5 - Production
| Document | Required | Icon |
|----------|----------|------|
| Factory QC Report | Yes | fa-clipboard-check |
| Pre-Assembly Photos | Yes | fa-camera-retro |
| Production Payment Receipt (40%) | Yes | fa-receipt |
| Delivery Receipt | Yes | fa-truck |
| Phase 5 Sign-off | Yes | fa-signature |

### Step 6 - Installation
| Document | Required | Icon |
|----------|----------|------|
| Installation Progress Photos | Yes | fa-hard-hat |
| Certificate of Occupancy | Yes | fa-certificate |
| Final Inspection Report | Yes | fa-search |
| Final Acceptance Sign-off | Yes | fa-signature |
| Final Payment Receipt (10%) | Yes | fa-receipt |
| Warranty & Manuals | Yes | fa-book |

---

## Appendix B: Project Data Model (UX Reference)

```
Project
├── id, name, type (Sunroom/Pergola/ADU/Zip Blinds)
├── workflowStep (1-6)
├── stage (intent/design/measurement/quotation/production/installation)
├── riskLevel (high/medium/low)
├── budget, paid, timeline, startDate
├── Customer
│   ├── name, email, phone, address
│   └── status (VIP/Active/New)
├── Order
│   ├── id, product, total, status, date
│   └── paymentPlan (intent/design/deposit/production/final)
├── Risks[]
│   ├── title, severity (high/medium/low), status (open/monitoring/resolved)
├── Issues[]
│   ├── title, priority, status (open/in_progress/resolved)
│   ├── assignedTo, dueDate
└── Documents[] (per workflow step)
    ├── key, label, icon, required, uploadedAt, fileUrl
```

---

*This document is continuously evolving. Update it whenever UX decisions are made, new pages are designed, or user feedback drives changes.*
