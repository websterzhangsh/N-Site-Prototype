# Pricing & Cost Controller Agent - Requirement Specification

**Version:** 1.0.0
**Last Updated:** 2024-03-11
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose
Pricing & Cost Controller Agent is an intelligent quotation system that automatically calculates project costs, suggests optimal pricing strategies, and protects profit margins. It enables small business owners to generate accurate, competitive quotes in seconds while maintaining profitability.

### 1.2 Target Users
- Small business owners in outdoor living industry
- Sales representatives creating quotes
- Project managers estimating costs

### 1.3 Key Value Proposition
- **OUTPUT**: Generate profit-protected quotes in <60 seconds with AI-optimized pricing
- **Differentiator**: Smart pricing suggestions based on market data, not guesswork

---

## 2. User Stories

### 2.1 Primary User Stories

| ID | User Story | Priority |
|----|------------|----------|
| US-001 | As a business owner, I want to calculate project costs automatically so I can quote accurately | P0 |
| US-002 | As a sales rep, I want to see material, labor, and permit costs broken down so I understand the pricing | P0 |
| US-003 | As a business owner, I want AI-suggested pricing options so I can choose the best strategy | P0 |
| US-004 | As a sales rep, I want to see profit margin analysis so I know if the deal is worth pursuing | P0 |
| US-005 | As a business owner, I want to adjust discounts and surcharges so I can customize pricing | P1 |
| US-006 | As a sales rep, I want risk alerts on pricing so I avoid unprofitable deals | P1 |

### 2.2 Secondary User Stories

| ID | User Story | Priority |
|----|------------|----------|
| US-007 | As a user, I want to save quotes to project history so I can retrieve them later | P2 |
| US-008 | As a user, I want to send quotes directly to clients so I can close deals faster | P2 |
| US-009 | As a user, I want to generate contracts from quotes so I can formalize agreements | P2 |
| US-010 | As a user, I want to see historical pricing trends so I can make better decisions | P3 |

---

## 3. Functional Requirements

### 3.1 Input Module

#### 3.1.1 Project Selection
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-001 | System shall display dropdown of active projects with client and product info | P0 |
| FR-002 | System shall show project budget range on selection | P0 |
| FR-003 | System shall display yard size and location for context | P1 |

#### 3.1.2 Product Configuration
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-004 | System shall provide dimension inputs (Width, Depth, Height) in feet | P0 |
| FR-005 | System shall calculate and display total square footage automatically | P0 |
| FR-006 | System shall provide material selection (Aluminum, Vinyl) with pricing context | P0 |
| FR-007 | System shall provide glass type selection with cost add-ons displayed | P1 |
| FR-008 | System shall update estimated costs in real-time as configuration changes | P1 |

#### 3.1.3 Additional Options
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-009 | System shall display checkbox options with individual costs (Ceiling Fan, LED Lighting, Electrical Outlets, Permit Handling) | P0 |
| FR-010 | System shall show total additional options cost | P1 |
| FR-011 | System shall persist selected options in session state | P1 |

#### 3.1.4 Pricing Adjustments
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-012 | System shall provide discount slider (0-20%) with real-time preview | P0 |
| FR-013 | System shall provide urgency surcharge dropdown (Standard/Express/Rush) | P0 |
| FR-014 | System shall allow notes input for special requirements | P2 |
| FR-015 | System shall warn when discount exceeds profit margin threshold | P1 |

### 3.2 Output Module

#### 3.2.1 Cost Breakdown
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-016 | System shall display line-item costs: Materials, Labor, Equipment, Permits, Additional Options | P0 |
| FR-017 | System shall show total cost prominently | P0 |
| FR-018 | System shall update breakdown when inputs change | P0 |

#### 3.2.2 Profit Analysis
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-019 | System shall display suggested price | P0 |
| FR-020 | System shall display net profit amount | P0 |
| FR-021 | System shall display profit margin percentage | P0 |
| FR-022 | System shall show visual margin indicator (Risk Zone / Healthy / Premium) | P1 |

#### 3.2.3 Smart Quote Suggestions
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-023 | System shall provide three pricing tiers: Conservative, Recommended, Premium | P0 |
| FR-024 | System shall display margin and profit for each tier | P0 |
| FR-025 | System shall highlight "Best Match" recommendation | P0 |
| FR-026 | System shall show rationale for each suggestion (e.g., "Within budget range") | P1 |

#### 3.2.4 Risk Alerts
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-027 | System shall display risk alerts panel with warnings | P1 |
| FR-028 | System shall show material price increase predictions | P1 |
| FR-029 | System shall show permit processing time estimates | P1 |
| FR-030 | System shall highlight risks affecting profitability | P1 |

#### 3.2.5 Actions
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-031 | System shall provide "Save Quote" action | P1 |
| FR-032 | System shall provide "Send to Client" action | P2 |
| FR-033 | System shall provide "Generate Contract" action | P2 |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-001 | Cost calculation time | <2 seconds |
| NFR-002 | Page load time | <2 seconds |
| NFR-003 | Real-time update latency | <500ms |

### 4.2 Accuracy
| Req ID | Requirement |
|--------|-------------|
| NFR-004 | Cost estimates within 10% of actual |
| NFR-005 | Material prices updated weekly |
| NFR-006 | Labor rates reflect local market |

### 4.3 Usability
| Req ID | Requirement |
|--------|-------------|
| NFR-007 | Complete quote generation in <60 seconds |
| NFR-008 | Clear visual hierarchy for costs |
| NFR-009 | Mobile-responsive for on-site quoting |

### 4.4 Security
| Req ID | Requirement |
|--------|-------------|
| NFR-010 | Quote data encrypted at rest |
| NFR-011 | Access controlled by tenant isolation |
| NFR-012 | Audit trail for pricing changes |

---

## 5. UI/UX Specifications

### 5.1 Layout
- **Desktop**: Two-column grid (Input left, Output right)
- **Mobile**: Stacked layout
- **Breakpoint**: lg:grid-cols-2 at 1024px

### 5.2 Color Scheme
- Primary accent: Emerald (#10B981)
- Profit positive: Green
- Profit warning: Amber
- Profit risk: Red
- Quote tiers: Blue (Conservative), Emerald (Recommended), Purple (Premium)

### 5.3 Typography
- Currency values: font-bold, text-lg
- Percentages: font-medium
- Labels: text-gray-500, text-sm

### 5.4 Components
- Cost line items: Icon + label + right-aligned value
- Quote cards: Selectable with border highlight
- Margin indicator: Horizontal gradient bar with position marker
- Risk alerts: Amber background with warning icon

---

## 6. Data Models

### 6.1 Pricing Session
```typescript
interface PricingSession {
  id: string;
  projectId: string;
  configuration: ProductConfiguration;
  adjustments: PricingAdjustments;
  costBreakdown: CostBreakdown;
  suggestedQuotes: QuoteSuggestion[];
  selectedQuote: 'conservative' | 'recommended' | 'premium';
  riskAlerts: RiskAlert[];
  createdAt: Date;
  createdBy: string;
}
```

### 6.2 Product Configuration
```typescript
interface ProductConfiguration {
  width: number;
  depth: number;
  height: number;
  material: 'aluminum' | 'vinyl';
  glassType: 'tempered' | 'low-e' | 'tinted' | 'double-paned';
  options: {
    ceilingFan: boolean;
    lighting: boolean;
    electrical: boolean;
    permit: boolean;
  };
}
```

### 6.3 Cost Breakdown
```typescript
interface CostBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  permits: number;
  additionalOptions: number;
  total: number;
}
```

### 6.4 Quote Suggestion
```typescript
interface QuoteSuggestion {
  type: 'conservative' | 'recommended' | 'premium';
  price: number;
  profit: number;
  margin: number;
  rationale: string;
}
```

---

## 7. Pricing Algorithm

### 7.1 Cost Calculation Formula
```
Materials = (Width × Depth) × MaterialRatePerSqft + GlassUpcharge
Labor = (Width × Depth) × LaborRatePerSqft
Equipment = (Width × Depth) × EquipmentRatePerSqft
Permits = BasePermitFee + (ElectricalPermitFee if applicable)
AdditionalOptions = Sum(selected options)

TotalCost = Materials + Labor + Equipment + Permits + AdditionalOptions
```

### 7.2 Quote Generation
```
Conservative = TotalCost × 1.10  (10% margin)
Recommended = TotalCost × 1.183  (18% margin)
Premium = TotalCost × 1.34       (25% margin)
```

### 7.3 Risk Assessment
- Material price volatility (tariff impacts)
- Permit processing delays by jurisdiction
- Seasonal demand fluctuations
- Labor availability

---

## 8. API Endpoints

### 8.1 Calculate Pricing
```
POST /api/v1/pricing/calculate
Request: { projectId, configuration, adjustments }
Response: { costBreakdown, profitAnalysis, suggestedQuotes, riskAlerts }
```

### 8.2 Save Quote
```
POST /api/v1/quotes
Request: { pricingSession, projectId }
Response: { quoteId, status }
```

### 8.3 Send Quote
```
POST /api/v1/quotes/{quoteId}/send
Request: { recipientEmail, message? }
Response: { status, sentAt }
```

### 8.4 Generate Contract
```
POST /api/v1/quotes/{quoteId}/contract
Response: { contractId, downloadUrl }
```

---

## 9. Integration Points

### 9.1 Internal Integrations
| System | Integration Type | Purpose |
|--------|-----------------|---------|
| AI Designer | Receive data | Import design specifications |
| Compliance Manager | API call | Fetch permit requirements |
| Project Management | Data read/write | Save quotes to projects |
| Contract Generator | Deep link | Create contracts from quotes |

### 9.2 External Integrations
| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Material Supplier API | API | Real-time material pricing |
| Market Data Service | API | Local labor rate benchmarks |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quote generation time | <60 seconds | System logs |
| Quote accuracy | >90% within 10% | Post-project analysis |
| Quote-to-close rate | >40% | CRM analytics |
| Average profit margin | 15-25% | Financial reports |
| User adoption rate | >80% | Active users / Total users |

---

## 11. Implementation Roadmap

### Phase 1: MVP (Current)
- [x] Basic UI with Input/Output sections
- [x] Cost calculation logic
- [x] Quote suggestion tiers
- [x] Dummy data for testing
- [ ] Backend API integration
- [ ] Real material pricing

### Phase 2: Enhancement
- [ ] Historical pricing analytics
- [ ] Market rate integration
- [ ] Quote templates
- [ ] Bulk quoting

### Phase 3: Advanced
- [ ] Predictive pricing AI
- [ ] Competitive analysis
- [ ] Dynamic pricing optimization
- [ ] Multi-currency support

---

## 12. Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Material Pricing Database | Internal | Pending |
| Labor Rate Service | External | Evaluation |
| Contract Template Engine | Internal | Available |
| Email Service | Internal | Available |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Material price volatility | High | Real-time pricing feeds, buffer recommendations |
| Inaccurate labor estimates | Medium | Local rate database, manual override option |
| Quote undercutting | Medium | Margin protection alerts, value proposition guidance |
| Data staleness | Medium | Weekly price updates, last-updated timestamps |

---

**Document Owner:** Product Team
**Review Cycle:** Quarterly
**Next Review:** Q2 2024
