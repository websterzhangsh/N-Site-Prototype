# Nestopia Production Deployment Strategy

> This document captures the deployment architecture decisions for the Nestopia production website.
>
> **Decision Date**: 2026-03-31
> **Stakeholder**: Webster Zhang (CTO, Nestopia Tech. Inc.)

---

## 1. Background

Nestopia currently operates a development/staging site deployed on Cloudflare Pages:

| Item | Detail |
|------|--------|
| Repository | `websterzhangsh/N-Site-Prototype` (GitHub) |
| Branch | `main` (single branch) |
| Platform | Cloudflare Pages |
| URL | `n-site-prototype.pages.dev` |
| Deployment | Auto-deploy on push to `main` |

The objective is to deploy a **production-grade site** under a commercially registered domain with version-controlled releases, separate from the dev/staging environment.

---

## 2. Domain Assets

Three domains were registered via Namecheap on 2026-01-18 (Order #192357343):

| Domain | Duration | Cost | Email Service | Role |
|--------|----------|------|---------------|------|
| `ai-nestopia.com` | 2 years | $26.26 | — | **Primary production domain** |
| `ai-nestopia.ai` | 2 years | $159.96 | — | Reserved (future redirect) |
| `ai-nestopia.io` | 2 years | $92.96 | Pro Email (3 mailboxes) | Reserved (email service active) |

**Registrant**: NESTOPIA TECH. INC., 1811 Silverside Road, Suite 260, Wilmington, DE 19180, US

**Primary production domain**: `ai-nestopia.com`

---

## 3. Architecture Decisions

### 3.1 DNS Management — Stay with Namecheap

**Decision**: DNS management remains at Namecheap. Do NOT transfer nameservers to Cloudflare.

**Rationale**: The production infrastructure may migrate from Cloudflare Pages to a hyperscaler (e.g., AWS in US) in the future. Keeping DNS at Namecheap ensures:

- **Platform-agnostic**: DNS is decoupled from any hosting provider
- **Low-risk migration**: Switching from Cloudflare to AWS requires only a CNAME/A Record change at Namecheap — no nameserver migration, no DNS propagation delays
- **Zero downtime**: Traffic cutover during platform migration is immediate at the DNS level
- **Vendor independence**: No lock-in to Cloudflare's DNS ecosystem

### 3.2 Hosting Platform — Cloudflare Pages (Phase 1)

**Decision**: Use Cloudflare Pages as the initial production hosting platform.

**Rationale**:
- Already proven with the staging site
- Free tier supports custom domains + automatic SSL
- Cloudflare Pages Functions support the existing backend (AI Designer API, Chatbot)
- Fastest time-to-production with no infrastructure changes

**Future consideration**: Evaluate AWS (CloudFront + S3, or ECS/EKS) when:
- Backend requirements exceed Cloudflare Functions capabilities
- Need for US-region-specific data residency
- Multi-region deployment becomes necessary
- Advanced infrastructure features required (VPC, RDS, Lambda, etc.)

### 3.3 Branching Strategy — Dual Branch

**Decision**: Introduce a `production` branch alongside `main`.

| Branch | Purpose | Deploys To | Trigger |
|--------|---------|------------|---------|
| `main` | Development / Staging | `n-site-prototype.pages.dev` | Auto on push |
| `production` | Production releases | `ai-nestopia.com` | Auto on push/merge |

**Version control**: Every production deployment is traceable via:
1. Git tags (e.g., `v1.1.0`) on the commit being released
2. PR merge from `main` → `production` (provides review trail)
3. Cloudflare Pages deployment logs

---

## 4. Target Architecture

```
                 GitHub Repo (N-Site-Prototype)
                            │
               ┌────────────┴────────────┐
               │                         │
          main branch             production branch
               │                         │
               ▼                         ▼
    Cloudflare Pages Project 1   Cloudflare Pages Project 2
    (n-site-prototype)           (nestopia-production)
               │                         │
               ▼                         ▼
    n-site-prototype.pages.dev   ai-nestopia.com
         [DEV/STAGING]              [PRODUCTION]
                                         ▲
                                         │
                                  Namecheap DNS
                                  (CNAME Record)
```

### DNS Configuration (Namecheap)

```
Type    Host    Value                           TTL
CNAME   @       nestopia-production.pages.dev   Automatic
CNAME   www     nestopia-production.pages.dev   Automatic
```

> Note: If Namecheap does not support root domain CNAME (@ record),
> use URL Redirect (301) from @ to www, and CNAME www to Cloudflare.

### SSL

Cloudflare Pages automatically provisions SSL certificates for custom domains, even when DNS is managed externally. No manual SSL configuration required.

---

## 5. Release Workflow

### Daily Development (unchanged)

```bash
# Work on main branch as usual
git add . && git commit -m "feat: xxx" && git push origin main
# → Auto-deploys to n-site-prototype.pages.dev (staging)
```

### Production Release

```bash
# Step 1: Ensure main is stable and verified on staging
git checkout main && git pull origin main

# Step 2: Tag the release
git tag -a v1.x.x -m "Release v1.x.x: description"
git push origin v1.x.x

# Step 3: Merge to production
git checkout production && git pull origin production
git merge main
git push origin production
# → Auto-deploys to ai-nestopia.com (production)

# Step 4: Return to development
git checkout main
```

### Alternative: GitHub PR Workflow (recommended for team)

1. Create PR on GitHub: `main` → `production`
2. Review the diff (all changes since last release)
3. Approve and merge
4. Cloudflare auto-deploys to production

---

## 6. Implementation Steps

### Phase 1: Git Branch Setup

- [ ] Create `production` branch from `main`
- [ ] Push `production` branch to GitHub
- [ ] (Optional) Set up branch protection rules on GitHub

### Phase 2: Cloudflare Pages Project

- [ ] Create new Cloudflare Pages project (`nestopia-production`)
- [ ] Connect to GitHub repo, set production branch to `production`
- [ ] Configure build: command `npm run build`, output `dist`
- [ ] Verify deployment at `nestopia-production.pages.dev`

### Phase 3: Domain Binding

- [ ] Add `ai-nestopia.com` as custom domain in Cloudflare Pages
- [ ] Add CNAME record in Namecheap pointing to `nestopia-production.pages.dev`
- [ ] Add `www.ai-nestopia.com` as custom domain (optional)
- [ ] Verify SSL certificate provisioning
- [ ] Test site access via `https://ai-nestopia.com`

### Phase 4: Verification

- [ ] Confirm `ai-nestopia.com` loads correctly
- [ ] Confirm SSL (HTTPS) is active
- [ ] Confirm pushing to `main` does NOT affect production
- [ ] Confirm pushing to `production` deploys to `ai-nestopia.com`
- [ ] Test AI Designer API and Chatbot on production domain

### Phase 5: Future Domain Configuration (deferred)

- [ ] Set up `ai-nestopia.ai` redirect to `ai-nestopia.com`
- [ ] Set up `ai-nestopia.io` redirect to `ai-nestopia.com`
- [ ] Configure email service for `ai-nestopia.com` (currently only `.io` has email)

---

## 7. Future Migration Path (AWS)

When the decision is made to migrate to AWS:

```
Current:  Namecheap DNS → CNAME → Cloudflare Pages
Future:   Namecheap DNS → CNAME/A → AWS CloudFront Distribution
```

**Migration steps (when ready)**:
1. Set up AWS infrastructure (S3 + CloudFront, or ECS/EKS)
2. Deploy and verify the site on AWS (using CloudFront URL)
3. Request SSL certificate via AWS Certificate Manager
4. Update Namecheap CNAME to point to CloudFront distribution
5. Decommission Cloudflare Pages production project

**Expected downtime**: Near-zero (DNS TTL-based cutover)

---

## 8. Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Domain: ai-nestopia.com | $26.26 | 2 years (paid) |
| Domain: ai-nestopia.ai | $159.96 | 2 years (paid) |
| Domain: ai-nestopia.io | $92.96 | 2 years (paid) |
| Cloudflare Pages hosting | Free | Ongoing |
| Cloudflare SSL | Free | Auto-renewed |
| Namecheap DNS | Free (included) | Ongoing |
| **Total domain investment** | **$279.58** | Paid through Jan 2028 |

---

*Document created: 2026-03-31*
*To be updated when Phase 1-5 implementation begins.*
