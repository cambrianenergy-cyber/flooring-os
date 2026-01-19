---
title: "Square Flooring Pro Suite — Enterprise Tier Naming & Positioning"
subtitle: "Marketing-Grade Brand Names + Database Entitlements + Sales Language + Revenue Modeling"
---

# Enterprise Tier Naming & Go-to-Market Strategy

## Part 1: Enterprise-Grade Tier Names (Square Flooring Pro Suite)

### The Old Names (Weak)
- Core
- Operations
- Scale  
- Enterprise

**Problem:** Generic. Could be any SaaS. No positioning.

### The New Names (Enterprise-Grade)

| Level | Old | New | Tagline | Audience |
|-------|-----|-----|---------|----------|
| 1 | Core | **Square Essentials** | "The Foundation" | Small crews (3–5 users) |
| 2 | Operations | **Square Professional** | "The Backbone" | Growing companies (5–15 users) |
| 3 | Scale | **Square Enterprise** | "The Operating System" | Large operators (15–25 users) |
| 4 | Enterprise | **Square Infrastructure** | "The Replacement" | National brands (25+ users) |

---

### ✨ **Tier 1: Square Essentials**

**Brand Signal:** "We're a real business with real software."

**Positioning:**
- Entry point for serious teams
- Not cheap, but focused
- Professional tools without overwhelm

**Marketing Language:**
> *"Square Essentials is for flooring companies that measure once, estimate once, and close the deal. Everything you need to run a tight, professional operation."*

**Visual/Brand:**
- 🔷 Navy Blue + Gold (professional, trustworthy)
- Icon: Foundation / Building Block
- Badge: "Essential Flooring Tools"

**Pricing Anchor:** $299/month = $57.60/user (for 5-person crew)

---

### 🔶 **Tier 2: Square Professional**

**Brand Signal:** "We're scaling our flooring business systematically."

**Positioning:**
- For teams that do 10–30 projects per month
- Multi-project management
- Installer coordination begins here

**Marketing Language:**
> *"Square Professional is built for flooring companies that juggle multiple jobs, multiple crews, and multiple installs. It's where you stop losing money to bad estimates and start scaling intelligently."*

**Visual/Brand:**
- 🟠 Orange + Deep Gray (energy, growth)
- Icon: Upward Arrow / Expansion
- Badge: "Professional Grade Estimating"

**Pricing Anchor:** $699/month = $46.60/user (for 15-person team)

---

### 🟢 **Tier 3: Square Enterprise**

**Brand Signal:** "This flooring company operates like a tech company."

**Positioning:**
- For regional operators and multi-branch companies
- Advanced analytics, AI, compliance
- Replaces spreadsheets + legacy tools

**Marketing Language:**
> *"Square Enterprise is the operating system for flooring companies that have outgrown spreadsheets. It's where measurement meets intelligence, and estimates meet profit."*

**Visual/Brand:**
- 🟢 Forest Green + Silver (trust, intelligence)
- Icon: Brain / Intelligence / Dashboard
- Badge: "AI-Powered Flooring Operations"

**Pricing Anchor:** $1,299/month = $52/user (for 25-person team)

---

### ⬛ **Tier 4: Square Infrastructure**

**Brand Signal:** "We're a flooring company that happens to use our own software."

**Positioning:**
- For national brands, franchises, distributors
- Custom built, contract negotiated
- You become the customer success story

**Marketing Language:**
> *"Square Infrastructure isn't software you buy. It's infrastructure you implement. Built for flooring companies that operate across regions, manage installer networks, and compete at national scale."*

**Visual/Brand:**
- ⬛ Black + Gold (premium, exclusive)
- Icon: Network / Enterprise / Integration
- Badge: "Enterprise-Class Flooring Platform"

**Pricing:** $2,500–$5,000/month (custom)

---

## Part 2: Exact Database Entitlements Per Tier

### Database Schema (Firestore)

```typescript
// /subscriptions/{subscriptionId}
interface SubscriptionEntitlements {
  // Tier
  tier: "essentials" | "professional" | "enterprise" | "infrastructure";
  
  // Team Capacity
  maxUsers: number;
  maxTeams: number;
  maxLocations: number;
  
  // Measurement Tools
  tools: {
    laserIntegration: boolean;
    assistedDraw: boolean;
    walkTheRoom: boolean;
    advancedMeasure: boolean;
  };
  
  // Estimation & Optimization
  estimation: {
    rollCutOptimizer: boolean;
    seamPlanning: boolean;
    seamVisibilityRisk: boolean;
    directionalLayouts: boolean;
    cutListGeneration: boolean;
    wasteOptimization: boolean;
    aiIntelligence: boolean; // Square Intelligence™
  };
  
  // Installer Tools
  installerTools: {
    cutSheets: boolean;
    remeasureOverlays: boolean;
    installerPortal: boolean;
    mobileAccess: boolean;
  };
  
  // Analytics & Reporting
  analytics: {
    jobAuditTrails: boolean;
    advancedReporting: boolean;
    measurementLogs: boolean;
    regionalReporting: boolean;
    customDashboards: boolean;
    kpiTracking: boolean;
  };
  
  // Management & Organization
  management: {
    roleBasedPermissions: boolean;
    companyTemplates: boolean;
    brandedProposals: boolean;
    multiLocation: boolean;
    customWorkflows: boolean;
  };
  
  // Compliance & Security
  compliance: {
    auditExports: boolean;
    customAgreements: boolean;
    sso: boolean; // Single Sign-On
    dataResidency: boolean; // On-premise option
    hipaa: boolean;
  };
  
  // Usage Limits
  limits: {
    proposalsPerMonth: number;
    roomsPerJob: number;
    storageGB: number;
    apiCallsPerDay: number;
  };
  
  // Support
  support: {
    tier: "standard" | "priority" | "dedicated";
    responseSLA: "48h" | "24h" | "12h" | "4h";
    dedicatedManager: boolean;
    trainingHours: number;
    phoneSupport: boolean;
  };
  
  // Billing
  monthlyPrice: number;
  annualPrice: number;
  includesSquareIntelligence: boolean;
}
```

### Tier-by-Tier Breakdown

#### **Square Essentials (Tier 1)**

```typescript
const essentials: SubscriptionEntitlements = {
  tier: "essentials",
  
  // Team: Small crew
  maxUsers: 5,
  maxTeams: 1,
  maxLocations: 1,
  
  // Measurement (Basic)
  tools: {
    laserIntegration: true,      // ✅ Can use Leica
    assistedDraw: true,          // ✅ Point-and-click
    walkTheRoom: true,           // ✅ Walk perimeter
    advancedMeasure: false,       // ❌ No photo measure
  },
  
  // Estimation (No Optimization)
  estimation: {
    rollCutOptimizer: false,      // ❌ No AI cut planning
    seamPlanning: false,          // ❌ Manual only
    seamVisibilityRisk: false,    // ❌ No analysis
    directionalLayouts: false,    // ❌ No patterns
    cutListGeneration: false,     // ❌ No auto-lists
    wasteOptimization: false,     // ❌ No waste calc
    aiIntelligence: false,        // ❌ No AI
  },
  
  // Installer Tools (None)
  installerTools: {
    cutSheets: false,             // ❌ Manual only
    remeasureOverlays: false,     // ❌ No comparison
    installerPortal: false,       // ❌ Not available
    mobileAccess: false,          // ❌ Web only
  },
  
  // Analytics (Minimal)
  analytics: {
    jobAuditTrails: false,        // ❌ No audit
    advancedReporting: false,     // ❌ No dashboards
    measurementLogs: false,       // ❌ No logs
    regionalReporting: false,     // ❌ N/A (1 location)
    customDashboards: false,      // ❌ Not available
    kpiTracking: false,           // ❌ Not available
  },
  
  // Management (Single Location Only)
  management: {
    roleBasedPermissions: false,  // ❌ Basic access
    companyTemplates: false,      // ❌ Not available
    brandedProposals: false,      // ❌ Default branding
    multiLocation: false,         // ❌ Single location only
    customWorkflows: false,       // ❌ Standard flow
  },
  
  // Compliance (None)
  compliance: {
    auditExports: false,          // ❌ Not available
    customAgreements: false,      // ❌ Standard terms
    sso: false,                   // ❌ No SSO
    dataResidency: false,         // ❌ Cloud only
    hipaa: false,                 // ❌ Not HIPAA
  },
  
  // Limits
  limits: {
    proposalsPerMonth: 50,
    roomsPerJob: 100,
    storageGB: 100,
    apiCallsPerDay: 1000,
  },
  
  // Support
  support: {
    tier: "standard",
    responseSLA: "48h",
    dedicatedManager: false,
    trainingHours: 0,
    phoneSupport: false,
  },
  
  // Billing
  monthlyPrice: 299,
  annualPrice: 3000,
  includesSquareIntelligence: false,
};
```

#### **Square Professional (Tier 2)**

```typescript
const professional: SubscriptionEntitlements = {
  tier: "professional",
  
  // Team: Growing
  maxUsers: 15,
  maxTeams: 3,
  maxLocations: 1,
  
  // Measurement (Advanced)
  tools: {
    laserIntegration: true,
    assistedDraw: true,
    walkTheRoom: true,
    advancedMeasure: true,        // ✅ Photo measure enabled
  },
  
  // Estimation (Roll-Cut Basics)
  estimation: {
    rollCutOptimizer: true,       // ✅ Basic optimizer
    seamPlanning: true,           // ✅ Manual planning UI
    seamVisibilityRisk: false,    // ❌ No risk scoring
    directionalLayouts: true,     // ✅ Herringbone, diagonal
    cutListGeneration: true,      // ✅ Auto-generate lists
    wasteOptimization: false,     // ❌ No AI waste calc
    aiIntelligence: false,        // ❌ No AI (add-on available)
  },
  
  // Installer Tools (Cut Sheets Only)
  installerTools: {
    cutSheets: true,              // ✅ PDF cut sheets
    remeasureOverlays: true,      // ✅ Compare old vs new
    installerPortal: false,       // ❌ Not available
    mobileAccess: false,          // ❌ Web only
  },
  
  // Analytics (Basic)
  analytics: {
    jobAuditTrails: true,         // ✅ Track changes
    advancedReporting: false,     // ❌ No dashboards
    measurementLogs: false,       // ❌ No detailed logs
    regionalReporting: false,     // ❌ N/A (1 location)
    customDashboards: false,      // ❌ Not available
    kpiTracking: false,           // ❌ Not available
  },
  
  // Management (Basic)
  management: {
    roleBasedPermissions: false,  // ❌ Not available
    companyTemplates: false,      // ❌ Not available
    brandedProposals: false,      // ❌ Default branding
    multiLocation: false,         // ❌ Single location only
    customWorkflows: false,       // ❌ Standard flow
  },
  
  // Compliance (None)
  compliance: {
    auditExports: false,
    customAgreements: false,
    sso: false,
    dataResidency: false,
    hipaa: false,
  },
  
  // Limits
  limits: {
    proposalsPerMonth: 250,
    roomsPerJob: 500,
    storageGB: 500,
    apiCallsPerDay: 5000,
  },
  
  // Support
  support: {
    tier: "standard",
    responseSLA: "24h",
    dedicatedManager: false,
    trainingHours: 4,
    phoneSupport: false,
  },
  
  // Billing
  monthlyPrice: 699,
  annualPrice: 7000,
  includesSquareIntelligence: false, // Must add $99/mo
};
```

#### **Square Enterprise (Tier 3)**

```typescript
const enterprise: SubscriptionEntitlements = {
  tier: "enterprise",
  
  // Team: Large
  maxUsers: 25,
  maxTeams: 10,
  maxLocations: 1,
  
  // Measurement (Full)
  tools: {
    laserIntegration: true,
    assistedDraw: true,
    walkTheRoom: true,
    advancedMeasure: true,
  },
  
  // Estimation (Full, with AI)
  estimation: {
    rollCutOptimizer: true,
    seamPlanning: true,
    seamVisibilityRisk: true,     // ✅ Risk analysis
    directionalLayouts: true,
    cutListGeneration: true,
    wasteOptimization: true,      // ✅ AI waste calc
    aiIntelligence: true,         // ✅ Full AI included
  },
  
  // Installer Tools (Cut Sheets)
  installerTools: {
    cutSheets: true,
    remeasureOverlays: true,
    installerPortal: false,       // ❌ Not available
    mobileAccess: false,          // ❌ Web only
  },
  
  // Analytics (Full)
  analytics: {
    jobAuditTrails: true,
    advancedReporting: true,      // ✅ Dashboards
    measurementLogs: true,        // ✅ Detailed logs
    regionalReporting: false,     // ❌ N/A (1 location)
    customDashboards: true,       // ✅ Custom
    kpiTracking: true,            // ✅ KPI dashboard
  },
  
  // Management (Full)
  management: {
    roleBasedPermissions: true,   // ✅ Granular roles
    companyTemplates: true,       // ✅ Save templates
    brandedProposals: true,       // ✅ Custom logos
    multiLocation: false,         // ❌ Single location (see Infrastructure)
    customWorkflows: false,       // ❌ Standard workflows
  },
  
  // Compliance (Basic)
  compliance: {
    auditExports: true,           // ✅ Audit reports
    customAgreements: false,      // ❌ Standard DPA
    sso: false,                   // ❌ No SSO
    dataResidency: false,         // ❌ Cloud only
    hipaa: false,                 // ❌ Not HIPAA
  },
  
  // Limits
  limits: {
    proposalsPerMonth: 99999,     // Unlimited
    roomsPerJob: 99999,           // Unlimited
    storageGB: 2000,              // 2 TB
    apiCallsPerDay: 50000,        // 50K calls
  },
  
  // Support
  support: {
    tier: "priority",
    responseSLA: "12h",
    dedicatedManager: false,
    trainingHours: 8,
    phoneSupport: true,           // ✅ Phone support
  },
  
  // Billing
  monthlyPrice: 1299,
  annualPrice: 13000,
  includesSquareIntelligence: true, // ✅ Included
};
```

#### **Square Infrastructure (Tier 4)**

```typescript
const infrastructure: SubscriptionEntitlements = {
  tier: "infrastructure",
  
  // Team: Unlimited
  maxUsers: Infinity,
  maxTeams: Infinity,
  maxLocations: Infinity,        // ✅ Multi-location unlimited
  
  // Measurement (Full)
  tools: {
    laserIntegration: true,
    assistedDraw: true,
    walkTheRoom: true,
    advancedMeasure: true,
  },
  
  // Estimation (Full, with AI)
  estimation: {
    rollCutOptimizer: true,
    seamPlanning: true,
    seamVisibilityRisk: true,
    directionalLayouts: true,
    cutListGeneration: true,
    wasteOptimization: true,
    aiIntelligence: true,
  },
  
  // Installer Tools (Full)
  installerTools: {
    cutSheets: true,
    remeasureOverlays: true,
    installerPortal: true,        // ✅ Mobile portal
    mobileAccess: true,           // ✅ iOS/Android
  },
  
  // Analytics (Full + Regional)
  analytics: {
    jobAuditTrails: true,
    advancedReporting: true,
    measurementLogs: true,
    regionalReporting: true,      // ✅ By location/region
    customDashboards: true,
    kpiTracking: true,
  },
  
  // Management (Full)
  management: {
    roleBasedPermissions: true,
    companyTemplates: true,
    brandedProposals: true,
    multiLocation: true,          // ✅ Full multi-location
    customWorkflows: true,        // ✅ Custom built
  },
  
  // Compliance (Full)
  compliance: {
    auditExports: true,
    customAgreements: true,       // ✅ Custom DPA
    sso: true,                    // ✅ SAML/OAuth
    dataResidency: true,          // ✅ On-premise available
    hipaa: true,                  // ✅ HIPAA compliance
  },
  
  // Limits
  limits: {
    proposalsPerMonth: Infinity,
    roomsPerJob: Infinity,
    storageGB: Infinity,          // ✅ Unlimited
    apiCallsPerDay: Infinity,     // ✅ Unlimited
  },
  
  // Support
  support: {
    tier: "dedicated",
    responseSLA: "4h",            // ✅ 4-hour SLA
    dedicatedManager: true,       // ✅ Account manager
    trainingHours: 40,            // ✅ 40 hours implementation
    phoneSupport: true,
  },
  
  // Billing
  monthlyPrice: 2500,             // Base (negotiable)
  annualPrice: 30000,
  includesSquareIntelligence: true,
};
```

---

## Part 3: Enterprise Sales Pitch + Deck Language

### The Sales Narrative (by Tier)

#### **Essentials: The Proof**

**Pitch (2 min):**

> *"You're a serious flooring company that's tired of spreadsheets. Square Essentials is built for small crews that want professional tools without the complexity. In 30 minutes, you'll be measuring with laser precision, generating professional estimates, and closing deals faster. That's $299/month for your entire team."*

**Proof Points:**
- ✅ Laser-accurate measurements (Leica integration)
- ✅ Professional proposals (not handwritten quotes)
- ✅ Digital signatures (close on site)
- ✅ 5-person team included
- ✅ 7-day free trial

**Pain Point Solved:**
> "You're losing contracts because your estimates look amateur, or you're spending 2 hours per job with tape measures and calculators."

**Close:**
> "Try it free for 7 days. No credit card. If you hate it, you lose nothing."

---

#### **Professional: The Growth**

**Pitch (3 min):**

> *"You've outgrown spreadsheets. You have multiple crews, multiple jobs, multiple installers. Square Professional adds intelligent optimization—automatic roll-cut planning, seam analysis, waste calculations—so you stop losing money on bad estimates. Your 15-person team gets access to installer cut sheets, audit trails, and multi-job management. That's $699/month."*

**Proof Points:**
- ✅ Roll-cut optimizer (saves 5–10% material waste)
- ✅ Seam planning (invisible seams, premium pricing)
- ✅ Cut sheets (installers know exactly what to cut)
- ✅ Audit trails (track every change)
- ✅ 15-person team
- ✅ Upgrade from Essentials in 1 click

**Pain Point Solved:**
> "You're managing multiple jobs, but your estimators are inconsistent. Some jobs are profitable, some lose money. You have no visibility into why."

**ROI Calculation:**
> "Average flooring company: 20 jobs/month. If you waste $500 in materials per job = $10K waste/month. Our optimizer recovers $2K–$3K/month. Pays for itself in 2 weeks."

**Close:**
> "Start 30-day trial of Professional features while keeping your Essentials price. See the savings yourself."

---

#### **Enterprise: The Operating System**

**Pitch (5 min):**

> *"You're running a regional flooring operation like it's 2005. You're juggling Google Sheets, Quickbooks, customer lists, installer schedules. Square Enterprise is the operating system that replaces your spreadsheets, your legacy tools, and your manual processes.*

> *We're talking AI-powered waste optimization, regional analytics by location, installer portals so your crews access measurements and cut sheets on iPad in the field, role-based access control so your office can't mess with installers' work, compliance exports for your insurance company.*

> *Your 25-person team across multiple locations gets one unified system. One source of truth. That's $1,299/month."*

**Proof Points:**
- ✅ AI included (waste optimization, seam analysis, complexity scoring)
- ✅ Regional reporting (see profit by location, by installer, by material type)
- ✅ Installer portals (iPad-ready in the field)
- ✅ Custom templates (company-wide brand consistency)
- ✅ Advanced analytics (KPI dashboard, audit trails)
- ✅ Role-based permissions (office staff can't override installer data)
- ✅ 25-person team, unlimited proposals
- ✅ Priority phone support (4 hours response)

**Pain Point Solved:**
> "You're a $2M/year flooring company, but you're operating with $50K/year worth of tools. You have no visibility into regional profitability. Your installers are guessing at cut lists from photos. Your office staff is re-entering data. You're losing 20% of potential profit to inefficiency."

**ROI Calculation:**
> "Average Enterprise customer: $2–5M annual revenue. Flooring margins: 25–35%. Loss to inefficiency: 15–20% (waste, rework, scheduling issues). If you're doing $3M revenue with 30% margin = $900K gross profit. Recover just 5% = $45K. Software costs $15,600/year. ROI = 3x in year 1."

**Close:**
> "Let's run a 2-week pilot with your team. Measure 3 actual jobs with our system, compare material waste vs. your current method. If you don't see savings, walk away."

---

#### **Infrastructure: The Replacement**

**Pitch (Executive, 10 min):**

> *"You're a national flooring brand with 50+ employees across 5 regions. You're competing with bigger budgets, better marketing, tighter margins. Your competitive advantage is operational excellence—measure faster, estimate smarter, execute perfectly.*

> *Square Infrastructure is built for companies like you. This isn't software you buy off the shelf. This is a custom implementation where we integrate into your workflow, your regional structure, your installer network.*

> *We're talking:*
> - *Unlimited users, unlimited locations, unlimited proposals*
> - *AI-powered waste optimization across all your jobs*
> - *Regional KPI dashboards (CEO sees profit by region, by product, by installer)*
> - *Installer mobile portals so your 200-person crew has cut sheets in their pocket*
> - *Custom workflows built for your exact process*
> - *Dedicated account manager, 4-hour support SLA, HIPAA/enterprise compliance*
> - *Your brand, your rules, your data*

> *We're looking at $40K–60K/year. For a company doing $10M+ in annual revenue, that's 0.4–0.6% of revenue. Your current legacy system costs you 3–5% of revenue in lost efficiency. Do the math."*

**Proof Points:**
- ✅ Unlimited everything (team, locations, proposals)
- ✅ Installer mobile portals (iOS/Android)
- ✅ Regional reporting + KPI dashboards
- ✅ Custom workflows built by our team
- ✅ Dedicated account manager
- ✅ 4-hour response SLA
- ✅ HIPAA, SOC2, custom DPA, on-premise option
- ✅ Single sign-on (SSO) + enterprise auth
- ✅ 40 hours implementation + onboarding

**Pain Point Solved:**
> "You're a $10M+ company that uses a patchwork of tools: legacy estimating software, QuickBooks, Google Sheets for regional tracking, Jira for installer tasks, Slack for logistics. You have no unified view of profitability. Your installers use phone calls and email. You lose 15–20% of profit to coordination overhead."

**ROI Calculation:**
> "If you're doing $10M revenue with 30% gross margin = $3M gross profit. 20% loss to inefficiency = $600K annual waste. Our system recovers 50% of that = $300K savings/year. Cost: $50K/year. ROI = 6x in year 1. After year 1, it's pure profit."

**Close:**
> "Let's schedule a 30-minute call with your executive team. We'll walk through a custom proposal, reference other national brands we work with, and show exactly how this integrates into your operation. No pressure, but if this works, you're looking at recovering $300K+ annually."

---

### Sample Sales Deck Outline (Pitch Deck for Enterprise)

#### Slide 1: Title
**Square Infrastructure**  
*The Operating System for National Flooring Brands*

#### Slide 2: The Problem
- Patchwork of tools (legacy software + sheets + Slack + email)
- No unified view of profitability
- 15–20% of revenue lost to inefficiency
- Installers operating blind (no real-time data)

#### Slide 3: The Market
- $55B flooring market (USA only)
- 10,000+ flooring companies, 60% still use spreadsheets
- Top 200 brands operate across 5+ regions
- Efficiency = competitive advantage

#### Slide 4: Our Solution
[Show architecture diagram]
- Single platform for measurement, estimation, installation, analytics
- Real-time sync across all locations
- Mobile-first for installers
- AI-powered optimization

#### Slide 5: Key Features
- **Measure:** Laser + photo + AI-assisted geometry
- **Estimate:** Roll-cut optimizer, seam analysis, waste prediction
- **Install:** Mobile portals, cut sheets, real-time tracking
- **Analyze:** Regional KPI dashboards, profit by location/product/installer

#### Slide 6: ROI Model
| Revenue | Margin | Waste % | Current Loss | Our Savings | Software Cost | Net Gain |
|---------|--------|---------|--------------|-------------|---------------|----------|
| $5M | 30% | 18% | $270K | $135K | $30K | $105K/yr |
| $10M | 30% | 18% | $540K | $270K | $50K | $220K/yr |
| $20M | 30% | 18% | $1.08M | $540K | $80K | $460K/yr |

#### Slide 7: Customer Story
[Case study: Regional brand, 5 locations, 50 employees]
- Before: 3 legacy systems, 2 spreadsheets, 40% manual data re-entry
- After: 1 platform, real-time sync, mobile installers, regional dashboards
- Result: +$150K annual profit, 30% faster estimates, 0 estimation errors

#### Slide 8: Implementation Timeline
- Week 1–2: Setup & integration
- Week 3–4: Team training
- Week 5–8: Soft launch (1 location)
- Week 9–12: Full rollout (all locations)
- Ongoing: Dedicated account manager

#### Slide 9: Next Steps
1. Schedule 30-min technical discovery
2. Custom proposal & pilot plan
3. Reference calls with similar companies
4. Contract negotiation
5. Go-live (4–6 weeks)

#### Slide 10: Contact
**You're now a national flooring company with operating system-grade efficiency.**

---

## Part 4: Revenue Modeling at Different Adoption Levels

### Market Segments

| Segment | Company Size | Annual Revenue | Est. Market | Adoption Rate | Avg. Price |
|---------|--------------|-----------------|-------------|----------------|------------|
| **Small** | 3–5 people | $500K–$2M | 5,000 cos. | 10% | $299/mo |
| **SMB** | 6–20 people | $2M–$5M | 3,000 cos. | 20% | $699/mo |
| **Enterprise** | 20–50 people | $5M–$15M | 1,000 cos. | 30% | $1,299/mo |
| **National** | 50+ people | $15M+ | 200 cos. | 50% | $3,500/mo |

---

### Scenario 1: Conservative Growth (Year 1–5)

**Assumptions:**
- Launch with Essentials tier only (limit scope)
- Focus on small companies (low-friction sales)
- 10% market adoption over 5 years

**Year 1:**
- 50 customers × $299/mo = $179K ARR
- + 10% upgrade to Professional = 5 × $699/mo = $42K ARR
- **Total: $221K ARR**

**Year 2:**
- 150 customers (3x growth)
- 15% upgrade rate (more mature customers)
- $537K + $126K = **$663K ARR**

**Year 3:**
- 300 customers (2x growth)
- 20% upgrade rate
- $1.08M + $336K = **$1.41M ARR**

**Year 4:**
- 500 customers (1.7x growth)
- 25% upgrade rate
- 10 Enterprise customers @ $1,299/mo
- $1.79M + $675K + $156K = **$2.62M ARR**

**Year 5:**
- 750 customers (1.5x growth)
- 30% upgrade rate
- 50 Enterprise customers
- 5 Infrastructure customers @ $3,500/mo
- $2.69M + $1.35M + $780K + $210K = **$5.03M ARR**

---

### Scenario 2: Aggressive Growth (Year 1–5)

**Assumptions:**
- Launch all tiers immediately
- Sales team from month 1
- Target SMB + Enterprise (higher margins)
- 25% market adoption over 5 years

**Year 1:**
- 100 Essentials × $299 = $357K
- 30 Professional × $699 = $251K
- 10 Enterprise × $1,299 = $155K
- **Total: $763K ARR**

**Year 2:**
- 300 Essentials (3x)
- 120 Professional (4x)
- 50 Enterprise (5x)
- 5 Infrastructure @ $3,500 = $210K
- $1.08M + $1.00M + $779K + $210K = **$3.07M ARR**

**Year 3:**
- 700 Essentials (2.3x)
- 350 Professional (2.9x)
- 200 Enterprise (4x)
- 25 Infrastructure (5x)
- $2.51M + $2.93M + $3.12M + $1.05M = **$9.61M ARR**

**Year 4:**
- 1,200 Essentials (1.7x)
- 700 Professional (2x)
- 500 Enterprise (2.5x)
- 100 Infrastructure (4x)
- $4.31M + $5.87M + $7.79M + $4.20M = **$22.17M ARR**

**Year 5:**
- 1,800 Essentials (1.5x)
- 1,200 Professional (1.7x)
- 1,200 Enterprise (2.4x)
- 300 Infrastructure (3x)
- $6.47M + $10.07M + $18.70M + $12.60M = **$47.84M ARR**

---

### Scenario 3: Enterprise-Focused (Year 1–5)

**Assumptions:**
- Skip Essentials tier (too much support cost)
- Focus on Professional tier (self-serve + low support)
- Target only Enterprise + Infrastructure (direct sales)
- Smaller customer count, higher prices

**Year 1:**
- 50 Professional × $699 = $419K
- 5 Enterprise × $1,299 = $78K
- 1 Infrastructure @ $3,500 = $42K
- **Total: $539K ARR**

**Year 2:**
- 150 Professional (3x)
- 25 Enterprise (5x)
- 5 Infrastructure (5x)
- $1.26M + $389K + $210K = **$1.86M ARR**

**Year 3:**
- 350 Professional (2.3x)
- 100 Enterprise (4x)
- 20 Infrastructure (4x)
- $2.93M + $1.55M + $840K = **$5.33M ARR**

**Year 4:**
- 700 Professional (2x)
- 300 Enterprise (3x)
- 75 Infrastructure (3.75x)
- $5.87M + $4.66M + $3.15M = **$13.68M ARR**

**Year 5:**
- 1,200 Professional (1.7x)
- 750 Enterprise (2.5x)
- 250 Infrastructure (3.3x)
- $10.07M + $11.64M + $10.50M = **$32.21M ARR**

---

### Unit Economics by Tier (Year 5, Mature)

#### **Essentials ($299/mo)**
- Customer Acquisition Cost (CAC): $150 (content + trial)
- Payback Period: 6.1 months
- Lifetime Value (LTV): $4,185 (5-year average customer)
- LTV/CAC: 27.9x ✅

#### **Professional ($699/mo)**
- CAC: $400 (sales calls + trial)
- Payback Period: 6.9 months
- LTV: $9,786
- LTV/CAC: 24.5x ✅

#### **Enterprise ($1,299/mo)**
- CAC: $2,000 (demo + meetings)
- Payback Period: 1.8 months
- LTV: $31,176
- LTV/CAC: 15.6x ✅

#### **Infrastructure ($3,500/mo)**
- CAC: $5,000 (executive steering + legal)
- Payback Period: 1.7 months
- LTV: $105,000 (3-year average)
- LTV/CAC: 21.0x ✅

---

### Blended Revenue Model (Realistic)

**Assumption:** 60% Essentials, 25% Professional, 12% Enterprise, 3% Infrastructure

**Year 5 Blended:**
- 1,080 Essentials × $299 × 12 = $3.87M
- 450 Professional × $699 × 12 = $3.77M
- 216 Enterprise × $1,299 × 12 = $3.37M
- 54 Infrastructure × $3,500 × 12 = $2.27M

**Total ARR: $13.27M**
**Average Revenue Per Account (ARPA): $1,847**
**Monthly Recurring Revenue (MRR): $1.11M**

---

### Key Metrics for Success

| Metric | Target | Impact |
|--------|--------|--------|
| **CAC Payback** | < 12 months | Cash flow positive |
| **LTV/CAC** | > 3.0x | Profitable unit economics |
| **Churn Rate** | < 5% annual | Sticky product |
| **Upgrade Rate** | 25%+ | Tier migration working |
| **Net Revenue Retention** | > 120% | Growing with customers |
| **Trial Conversion** | 35%+ | Product-market fit |

---

### Go-To-Market Strategy by Tier

#### **Essentials: Self-Serve + Content Marketing**
- Google Ads for "flooring estimating software"
- Free trial (7 days)
- Email nurture (education about precision measurement)
- Referral incentives ($100 per referral)
- **Sales Motion:** Fully self-serve

#### **Professional: Sales + Community**
- LinkedIn targeting (flooring company CEOs)
- Webinars (demo + ROI workshop)
- Industry partnerships (NFDA, installer networks)
- Trial + 30-day free Professional features
- **Sales Motion:** Inside sales (1 call to demo)

#### **Enterprise: Direct Sales + Case Studies**
- Executive prospecting ($5M+ flooring companies)
- Reference calls with similar companies
- Custom ROI calculator
- 30-day pilot with 2–3 locations
- **Sales Motion:** Full sales process (3–6 months)

#### **Infrastructure: Strategic Partnerships + Executive Sales**
- Target top 200 national flooring brands
- C-suite executive pitches
- Industry conferences (SURFACES, DOMOTEX)
- Custom implementation roadmap
- **Sales Motion:** Deal-based (6–12 months)

---

## Summary: Full GTM Timeline

### Year 1: Product + Essentials Launch
- **Focus:** Build product, launch Essentials tier, prove PMF
- **Target:** 50–100 Essentials customers
- **Revenue:** $200–400K ARR
- **Team:** Founder + 1 engineer + 1 community person

### Year 2: Professional Tier + SMB Sales
- **Focus:** Scale to SMB, add Professional tier, hire first sales person
- **Target:** 150 Essentials, 50–75 Professional
- **Revenue:** $800K–1.2M ARR
- **Team:** 5 people (2 engineers, 1 sales, 1 product, 1 ops)

### Year 3: Enterprise Tier + Direct Sales
- **Focus:** Enterprise sales process, hire sales team, build enterprise features
- **Target:** 300 Essentials, 150 Professional, 25–50 Enterprise
- **Revenue:** $3–5M ARR
- **Team:** 15 people (6 engineers, 3 sales, 1 sales ops, 1 product, 1 marketing, 1 ops, 1 finance, 1 CS)

### Year 4–5: Infrastructure Tier + Brand Dominance
- **Focus:** National brand positioning, executive relationships, market leadership
- **Target:** 1,000+ Essentials, 500+ Professional, 300+ Enterprise, 50+ Infrastructure
- **Revenue:** $15–50M ARR (depending on growth scenario)
- **Team:** 50–75 people (org expands to sales, customer success, operations, legal, finance)

---

## Conclusion

**Square Flooring Pro Suite** is positioned as:
1. **Essentials:** Professional entry point for small crews
2. **Professional:** Workhorse for growing companies
3. **Enterprise:** Operating system for large operators
4. **Infrastructure:** Complete replacement for national brands

**Revenue model supports $5M–50M ARR by Year 5**, depending on execution.

**Unit economics are strong** (LTV/CAC 15–28x across all tiers).

**This is enterprise software pricing and positioning**, not another "$99/month SaaS."

