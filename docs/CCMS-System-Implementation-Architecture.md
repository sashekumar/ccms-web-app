# CCMS (Comprehensive Care Management System) - System Implementation Architecture

**Version:** 1.0  
**Date:** March 19, 2026  
**Prepared for:** Medicare Sdn Bhd  
**Prepared by:** CCMS Development Team  

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Principles](#3-architecture-principles)
4. [Technical Architecture](#4-technical-architecture)
5. [Business Architecture](#5-business-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Workflow Architecture](#8-workflow-architecture)
9. [Integration Architecture](#9-integration-architecture)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Risk Mitigation](#11-risk-mitigation)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

The Comprehensive Care Management System (CCMS) is a modern healthcare insurance claims management platform designed to replace the legacy CUEPACS CARE system. This document provides a complete architectural blueprint for implementing a scalable, secure, and compliant system that manages healthcare insurance claims for CUEPACS (government employees union) members.

### Key Objectives
- Replace legacy desktop-based system with modern web platform
- Implement enterprise-grade role-based access control (RBAC)
- Ensure BNM (Bank Negara Malaysia) compliance for insurance operations
- Provide comprehensive claims lifecycle management
- Enable seamless integration with Medicare, FWD, and external systems

### System Scope
- **Users:** 500+ claims managers, assessors, administrators
- **Claims Volume:** 10,000+ monthly claims processing
- **Integration Points:** Medicare (policy admin), FWD (insurer), hospitals, banks
- **Compliance:** BNM insurance regulations, data protection standards

---

## 2. System Overview

### 2.1 System Purpose
CCMS serves as the central platform for managing healthcare insurance claims for CUEPACS members, providing end-to-end workflow management from claim registration through settlement and payment.

### 2.2 Stakeholder Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Medicare      │    │      FWD         │    │   CC4U (TPA)    │
│  (Policy Admin) │◄──►│   (Insurer)      │◄──►│  (Third Party   │
│                 │    │                  │    │   Administrator)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▲
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CCMS Application                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Policy      │  │ Claims      │  │ Financial   │             │
│  │ Management  │  │ Processing  │  │ Management  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Monitoring  │  │ Escalation  │  │ Reporting   │             │
│  │ & Tracking  │  │ Management  │  │ & Analytics │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Hospitals     │    │     Banks        │    │   Members       │
│                 │    │                  │    │                 │
│  (Panel/Non-   │    │  (Payment       │    │  (Policy Holders│
│   Panel)        │    │   Processing)   │    │   / Dependents) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2.3 Core System Components

1. **Authentication & Authorization Module**
   - JWT-based authentication with httpOnly cookies
   - Enterprise RBAC with 7 ACL tables
   - Automatic token refresh for seamless 7-day sessions

2. **Claims Processing Engine**
   - Multi-claim type support (GL, Pre, Post, MR, RL)
   - Automated eligibility checking
   - Medical assessment workflows

3. **Financial Management**
   - Payment advice generation
   - Multi-payment advice support
   - Stop-loss calculations
   - FWD accumulation tracking

4. **Monitoring & Escalation**
   - 8-hour monitoring alerts
   - Length of Stay (LOS) monitoring
   - Automated escalation workflows

5. **Investigation Module**
   - Medical investigation case management
   - Document request tracking
   - Call log management

---

## 3. Architecture Principles

### 3.1 Core Principles

#### 3.1.1 Separation of Concerns
- **Frontend:** React/Next.js SPA with component-based architecture
- **Backend:** Node.js/Express with strict MVC layer isolation
- **Database:** SQL Server with normalized schema design

#### 3.1.2 Security First
- **Authentication:** JWT with httpOnly cookies (XSS protection)
- **Authorization:** Role-based access control with granular permissions
- **Data Protection:** Parameterized queries (SQL injection prevention)
- **Audit Trail:** Comprehensive logging for all critical operations

#### 3.1.3 Compliance & Governance
- **BNM Compliance:** Hard stops for policy violations
- **Data Integrity:** Immutable audit logs for all changes
- **Role Segregation:** Clear separation between Medicare, FWD, and CC4U roles

#### 3.1.4 Scalability & Performance
- **Connection Pooling:** Optimized database connection management
- **Caching Strategy:** In-memory caching for frequently accessed data
- **Pagination:** Cursor-based pagination for large datasets
- **Indexing:** Strategic indexing for query optimization

### 3.2 Technology Stack

#### Frontend
- **Framework:** React 18 + Next.js (SSR/SSG)
- **State Management:** Redux Toolkit with RTK Query
- **Styling:** Tailwind CSS with component library
- **Forms:** React Hook Form with validation
- **Charts:** Chart.js for data visualization

#### Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js with middleware architecture
- **Database:** SQL Server 2019+ with connection pooling
- **Authentication:** JWT with httpOnly cookies
- **Validation:** Zod for runtime type checking
- **Logging:** Winston with structured logging

#### Infrastructure
- **Containerization:** Docker with multi-stage builds
- **Orchestration:** Kubernetes (optional for scaling)
- **Monitoring:** Application Insights / Prometheus
- **CI/CD:** GitHub Actions with automated testing

---

## 4. Technical Architecture

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    API Gateway                                  │
│  - Rate Limiting                                                │
│  - Authentication                                               │
│  - Request Routing                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Web Servers                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Frontend      │  │   Frontend      │  │   Frontend      │ │
│  │   (React/Next)  │  │   (React/Next)  │  │   (React/Next)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Application Servers                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Backend API   │  │   Backend API   │  │   Backend API   │ │
│  │   (Node.js)     │  │   (Node.js)     │  │   (Node.js)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Database Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   SQL Server    │  │   Redis Cache   │  │   Audit Logs    │ │
│  │   (Primary)     │  │   (Caching)     │  │   (File System) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Architecture

#### 4.2.1 Schema Overview
The CCMS database consists of **78 tables** organized into logical modules:

**Core Business Tables (71):**
- **Master Data (5 tables):** Lookups, configurations, banks, clauses
- **Providers (6 tables):** Hospitals, doctors, fee schedules, contacts
- **Products & Members (9 tables):** Plans, policies, members, dependents
- **Claims & Admissions (8 tables):** Claims, admissions, assessments, remarks
- **Financials (10 tables):** Payment advice, line items, breakdowns, payments
- **Uploads & Sync (8 tables):** File uploads, batch processing, RA matrix
- **Workflow (10 tables):** Escalations, investigations, checklists, call logs
- **Documents (4 tables):** File storage, reminders, query templates
- **Tracking (6 tables):** Status logs, milestones, durations, audit trails

**ACL Tables (7):**
- **Roles:** System and business roles
- **Categories:** Module categories for navigation
- **Modules:** Application features and pages
- **Actions:** Generic operations (VIEW, CREATE, UPDATE, DELETE)
- **Module Actions:** Bridge table linking modules to actions
- **Role Permissions:** Permission assignments to roles
- **User Roles:** User-role assignments with expiration support

#### 4.2.2 Key Database Features

```sql
-- Example: Hard Stop Implementation
CREATE PROCEDURE CheckPolicyEligibility
    @PolicyNo VARCHAR(50),
    @AdmissionDate DATE
AS
BEGIN
    -- Hard Stop: Policy Status Check
    IF EXISTS (SELECT 1 FROM ccms_member_policies 
               WHERE policy_no = @PolicyNo 
               AND status != 'INFORCE')
    BEGIN
        RAISERROR('Policy is not in force', 16, 1);
        RETURN;
    END
    
    -- Hard Stop: Waiting Period Check
    IF EXISTS (SELECT 1 FROM ccms_member_policies 
               WHERE policy_no = @PolicyNo 
               AND effective_date > DATEADD(DAY, -30, @AdmissionDate))
    BEGIN
        RAISERROR('Waiting period not cleared', 16, 1);
        RETURN;
    END
END
```

### 4.3 API Architecture

#### 4.3.1 RESTful API Design
- **Base URL:** `/api/v1/`
- **Authentication:** JWT in httpOnly cookies
- **Response Format:** JSON with consistent structure
- **Error Handling:** Standardized error responses
- **Versioning:** URL-based versioning

#### 4.3.2 Key API Endpoints

```typescript
// Authentication
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/refresh

// Claims Management
GET  /api/v1/claims?search=&status=&dateRange=
POST /api/v1/claims
GET  /api/v1/claims/:id
PUT  /api/v1/claims/:id/status

// Admissions
GET  /api/v1/admissions?patientId=&hospitalId=
POST /api/v1/admissions
PUT  /api/v1/admissions/:id/discharge

// Monitoring
GET  /api/v1/monitoring/8-hours
GET  /api/v1/monitoring/los
POST /api/v1/monitoring/:id/escalate

// Financials
GET  /api/v1/payment-advice?claimId=
POST /api/v1/payment-advice/:id/approve
```

---

## 5. Business Architecture

### 5.1 Business Process Flows

#### 5.1.1 Claims Processing Flow

```
┌─────────────────┐
│  Claim Intake   │
│  (Registration) │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Eligibility    │    │  Policy Status  │
│  Validation     │◄───┤  Hard Stops     │
│  (System)       │    │  (Auto Reject)  │
└─────────┬───────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐
│  Medical        │
│  Assessment     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  GL Issuance    │    │  Reimbursement  │
│  (Guarantee     │    │  Processing     │
│   Letter)       │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Admission      │    │  Document       │
│  Monitoring     │    │  Verification   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Discharge      │    │  Payment        │
│  Processing     │    │  Advice         │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Settlement     │    │  Payment        │
│  Processing     │    │  Processing     │
└─────────────────┘    └─────────────────┘
```

#### 5.1.2 Escalation Workflow

```
┌─────────────────┐
│  Trigger Event  │
│  (8Hr, LOS, IX) │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Auto          │
│  Escalation    │
│  Assignment    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Operation     │
│  Review        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Management    │    │  Assurance      │
│  Review        │    │  Review         │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Compliance    │    │  Settlement     │
│  Review        │    │  Review         │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Admin         │    │  Final          │
│  Escalation    │    │  Resolution     │
└─────────────────┘    └─────────────────┘
```

### 5.2 Business Rules Engine

#### 5.2.1 Hard Stop Rules (System Enforced)

```typescript
interface HardStopRule {
  id: string;
  description: string;
  condition: (claim: Claim) => boolean;
  action: 'REJECT' | 'ESCALATE';
  errorMessage: string;
}

const hardStopRules: HardStopRule[] = [
  {
    id: 'POLICY_STATUS',
    description: 'Policy must be in force',
    condition: (claim) => claim.policy.status === 'INFORCE',
    action: 'REJECT',
    errorMessage: 'Policy is not in force'
  },
  {
    id: 'WAITING_PERIOD',
    description: 'Waiting period must be cleared',
    condition: (claim) => claim.policy.effectiveDate <= claim.admissionDate - 30,
    action: 'REJECT',
    errorMessage: 'Waiting period not cleared'
  },
  {
    id: 'ANNUAL_LIMIT',
    description: 'Annual limit must be available',
    condition: (claim) => claim.policy.annualLimit > claim.policy.utilizedAmount,
    action: 'REJECT',
    errorMessage: 'Annual limit exceeded'
  }
];
```

#### 5.2.2 Soft Stop Rules (Controlled Override)

```typescript
interface SoftStopRule {
  id: string;
  description: string;
  condition: (claim: Claim) => boolean;
  overrideRequired: boolean;
  approvalLevel: 'SUPERVISOR' | 'MANAGER' | 'DIRECTOR';
  auditRequired: boolean;
}

const softStopRules: SoftStopRule[] = [
  {
    id: 'PENDING_IX',
    description: 'Investigation pending',
    condition: (claim) => claim.investigation.status === 'PENDING',
    overrideRequired: true,
    approvalLevel: 'SUPERVISOR',
    auditRequired: true
  },
  {
    id: 'HIGH_COST',
    description: 'High cost admission',
    condition: (claim) => claim.estimatedCost > 50000,
    overrideRequired: true,
    approvalLevel: 'MANAGER',
    auditRequired: true
  }
];
```

### 5.3 Role-Based Access Control

#### 5.3.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                          Super Admin                            │
│                    (Full System Access)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        Administrators                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ System Admin    │  │ Security Admin  │  │ Data Admin      │ │
│  │                 │  │                 │  │                 │ │
│  │ - User Mgmt     │  │ - Role Mgmt     │  │ - Data Import   │ │
│  │ - Module Mgmt   │  │ - Permission    │  │ - Backup/Restore│ │
│  │ - System Config │  │   Management    │  │ - Data Cleanup  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        Business Users                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Claims Manager  │  │ Claims Assessor │  │ Medical Review  │ │
│  │                 │  │                 │  │                 │ │
│  │ - Escalation    │  │ - Medical       │  │ - Medical       │ │
│  │   Management    │  │   Assessment    │  │   Approval      │ │
│  │ - Policy Review │  │ - Document      │  │ - Complex Cases │ │
│  │ - SLA Monitoring│  │   Verification  │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                          Support Staff                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Data Entry      │  │ Customer        │  │ Report Viewer   │ │
│  │                 │  │ Service         │  │                 │ │
│  │ - Claim         │  │ - Member        │  │ - Generate      │ │
│  │   Registration  │  │   Queries       │  │   Reports       │ │
│  │ - Document      │  │ - Escalation    │  │ - View          │ │
│  │   Upload        │  │   Support       │  │   Dashboards    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Permission Matrix

| Module | View | Create | Update | Delete | Approve | Reject | Export |
|--------|------|--------|--------|--------|---------|--------|--------|
| **Dashboard** | ✓ | - | - | - | - | - | ✓ |
| **Claims** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Admissions** | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| **Investigations** | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| **Escalations** | ✓ | - | ✓ | - | ✓ | - | ✓ |
| **Financials** | ✓ | - | ✓ | - | ✓ | - | ✓ |
| **Reports** | ✓ | - | - | - | - | - | ✓ |
| **Users** | ✓ | ✓ | ✓ | ✓ | - | - | - |
| **Roles** | ✓ | ✓ | ✓ | ✓ | - | - | - |

---

## 6. Data Architecture

### 6.1 Data Model Overview

#### 6.1.1 Core Entity Relationships

```
Members (1) ──── (N) Member_Policies
    │                    │
    │                    ▼
    │              Claims (1) ──── (N) Admissions
    │                    │                    │
    │                    ▼                    ▼
    │              Payment_Advice (1) ──── (N) PA_Line_Items
    │
    ▼
Member_Dependents (1) ──── (N) Member_PEC_Conditions
```

#### 6.1.2 Key Data Entities

**Claims Entity**
```typescript
interface Claim {
  id: string;
  claimRefNo: string;
  fwdClaimRefNo: string;
  member: Member;
  patientType: 'MEMBER' | 'DEPENDENT';
  patient: Member | Dependent;
  policy: MemberPolicy;
  hospital: Hospital;
  doctor: Doctor;
  diagnosis: Diagnosis;
  disabilityCode?: string;
  disabilityCategory?: string;
  claimStatus: ClaimStatus;
  claimMode: 'ONLINE' | 'MANUAL';
  priorityLevel: number;
  totalBilled: number;
  totalApproved: number;
  preAuthRequired: boolean;
  preAuthNo?: string;
  rejectionType?: string;
  rejectionReason?: string;
  rejectionDate?: Date;
  slaDays: number;
  slaDeadline: Date;
  slaStatus: 'ON_TIME' | 'OVERDUE' | 'ESCALATED';
  approvalAuthority?: string;
  approvalDate?: Date;
  batchNo?: string;
  payeeName?: string;
  payeeICNo?: string;
  payeeBankName?: string;
  payeeBankAccountNo?: string;
  isEC: boolean;
  ecStatus?: string;
  ecNotificationDate?: Date;
  ecClosedDate?: Date;
  documentReceivedAt?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
```

**Admission Entity**
```typescript
interface Admission {
  id: string;
  claim: Claim;
  glRefNo: string;
  admissionDate: Date;
  dischargeDate?: Date;
  losDays: number; // Computed
  admissionStatus: AdmissionStatus;
  admissionType: 'GL' | 'PRE' | 'POST' | 'MR';
  roomType: string;
  roomRate: number;
  icuDays: number;
  icuRate: number;
  ehmStatus: string;
  defermentStatus: string;
  alertFlag: boolean;
  assessments: AdmissionAssessment[];
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
```

### 6.2 Data Flow Architecture

#### 6.2.1 Data Ingestion Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Data          │    │   Data          │
│   Sources       │───▶│   Validation    │───▶│   Normalization │
│                 │    │                 │    │                 │
│ • Hospitals     │    │ • Format Check  │    │ • Standardize   │
│ • Banks         │    │ • Business Rules│    │   Formats       │
│ • Medicare      │    │ • Referential   │    │ • Clean Data    │
│ • FWD           │    │   Integrity     │    │ • Enrich Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data          │    │   Data          │    │   Data          │
│   Transformation│───▶│   Loading       │───▶│   Indexing      │
│                 │    │                 │    │                 │
│ • Mapping       │    │ • Bulk Insert   │    │ • Create        │
│ • Enrichment    │    │ • Error         │    │   Indexes       │
│ • Aggregation   │    │   Handling      │    │ • Update        │
│ • Validation    │    │ • Audit Trail   │    │   Statistics    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 6.2.2 Data Synchronization

**Medicare Integration**
- **Frequency:** Daily sync at 2 AM
- **Data:** Policy updates, member changes, endorsements
- **Method:** Secure API with OAuth 2.0
- **Error Handling:** Retry mechanism with exponential backoff

**FWD Integration**
- **Frequency:** Real-time for critical updates
- **Data:** Policy cancellations, claim rejections, approvals
- **Method:** Webhook notifications
- **Error Handling:** Queue-based processing with dead letter queue

### 6.3 Data Security & Privacy

#### 6.3.1 Data Classification

| Classification | Examples | Protection Level |
|----------------|----------|------------------|
| **Confidential** | Member PII, Medical records, Financial data | Encryption at rest & transit, RBAC |
| **Internal** | Policy details, Claim status, Internal notes | RBAC, Audit logging |
| **Public** | System status, Help documentation | Standard web security |

#### 6.3.2 Data Protection Measures

```typescript
// Data Encryption Example
class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.ENCRYPTION_KEY;
  
  encrypt(data: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('ccms-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('ccms-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

#### 7.1.1 JWT Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Login    │───▶│   Authentication│───▶│   JWT Token     │
│                 │    │   Service       │    │   Generation    │
│ • Username      │    │ • Validate      │    │ • Access Token  │
│ • Password      │    │   Credentials   │    │ • Refresh Token │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   httpOnly      │    │   Automatic     │    │   API Access    │
│   Cookie Set    │    │   Token Refresh │    │   with JWT      │
│                 │    │                 │    │                 │
│ • Secure Flag   │    │ • Check Expiry  │    │ • Validate      │
│ • HttpOnly Flag │    │ • Refresh Token │    │   Token         │
│ • SameSite      │    │ • New Token     │    │ • Extract       │
│   Strict        │    │   Generation    │    │   Claims        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 7.1.2 Role-Based Access Control Implementation

```typescript
// Permission Check Middleware
function checkPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user has required permission
    const hasPermission = await checkUserPermission(
      user.id, 
      req.route.path, 
      requiredPermission
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}

// Usage in Routes
app.get('/api/claims', checkPermission('CLAIMS_VIEW'), getClaims);
app.post('/api/claims', checkPermission('CLAIMS_CREATE'), createClaim);
app.put('/api/claims/:id', checkPermission('CLAIMS_UPDATE'), updateClaim);
```

### 7.2 Security Controls

#### 7.2.1 Input Validation & Sanitization

```typescript
// Zod Schema for Input Validation
const claimSchema = z.object({
  memberIC: z.string().regex(/^[A-Z0-9]+$/i, 'Invalid IC format'),
  hospitalId: z.number().positive('Invalid hospital ID'),
  admissionDate: z.date().min(new Date('1900-01-01'), 'Invalid date'),
  estimatedCost: z.number().min(0, 'Cost cannot be negative'),
  diagnosis: z.string().min(3, 'Diagnosis too short').max(500, 'Diagnosis too long')
});

// Middleware for Validation
function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}
```

#### 7.2.2 SQL Injection Prevention

```typescript
// Query Builder Implementation
class QueryBuilder {
  private query: string = '';
  private params: any[] = [];
  
  select(fields: string[]): this {
    this.query = `SELECT ${fields.join(', ')} FROM `;
    return this;
  }
  
  from(table: string): this {
    this.query += `${table} `;
    return this;
  }
  
  where(condition: string, ...values: any[]): this {
    this.query += `WHERE ${condition} `;
    this.params.push(...values);
    return this;
  }
  
  execute(): Promise<any[]> {
    // Uses parameterized queries automatically
    return this.connection.query(this.query, this.params);
  }
}

// Usage - Safe from SQL Injection
const query = new QueryBuilder()
  .select(['id', 'name', 'email'])
  .from('users')
  .where('email = ? AND status = ?', userEmail, 'ACTIVE')
  .execute();
```

### 7.3 Audit & Compliance

#### 7.3.1 Audit Trail Implementation

```typescript
// Audit Log Service
class AuditService {
  async logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: any
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      details: JSON.stringify(details),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    };
    
    await this.database.insert('ccms_audit_logs', auditEntry);
  }
  
  // Automatic Audit Logging Middleware
  auditMiddleware(action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(body: any) {
        // Log the action after response is sent
        setImmediate(async () => {
          await auditService.logAction(
            req.user?.id || 'ANONYMOUS',
            action,
            req.route?.path || req.path,
            req.params?.id || 'N/A',
            {
              request: req.body,
              response: body,
              statusCode: res.statusCode
            }
          );
        });
        
        originalSend.call(this, body);
      };
      
      next();
    };
  }
}
```

#### 7.3.2 BNM Compliance Features

**Hard Stop Implementation**
- Policy status validation before any processing
- Waiting period enforcement with automatic rejection
- Annual limit checking with real-time utilization tracking
- Duplicate admission prevention with cross-reference checks

**Audit Requirements**
- Immutable audit trail for all critical operations
- User action logging with timestamp and IP address
- Data change tracking with before/after values
- Regular compliance reporting capabilities

---

## 8. Workflow Architecture

### 8.1 Claims Processing Workflows

#### 8.1.1 Online GL Issuance Workflow

```
┌─────────────────┐
│  Hospital       │
│  Submission     │
└─────────┬───────┘
          │ (1. Admission Details)
          ▼
┌─────────────────┐
│  Claim Intake   │
│  Validation     │
└─────────┬───────┘
          │ (2. Validation Results)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Eligibility    │    │  Hard Stop      │
│  Check          │───▶│  (Auto Reject)  │
│                 │    │                 │
│ • Policy Status │    │ • Policy Lapsed │
│ • Waiting Period│    │ • Limit Exceed  │
│ • Annual Limit  │    │ • Duplicate     │
└─────────┬───────┘    └─────────────────┘
          │ (3. Eligible)
          ▼
┌─────────────────┐
│  Medical        │
│  Assessment     │
└─────────┬───────┘
          │ (4. Assessment)
          ▼
┌─────────────────┐
│  GL Generation  │
└─────────┬───────┘
          │ (5. GL Issued)
          ▼
┌─────────────────┐
│  Hospital       │
│  Notification   │
└─────────────────┘
```

#### 8.1.2 Reimbursement Processing Workflow

```
┌─────────────────┐
│  Member        │
│  Submission    │
└─────────┬───────┘
          │ (1. Documents)
          ▼
┌─────────────────┐
│  Document      │
│  Verification  │
└─────────┬───────┘
          │ (2. Verification Results)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Eligibility    │    │  Hard Stop      │
│  Check          │───▶│  (Auto Reject)  │
│                 │    │                 │
│ • Policy Active │    │ • Policy Lapsed │
│ • Admission     │    │ • Waiting       │
│   Before End    │    │   Period        │
│ • Coverage      │    │ • Limit Exceed  │
└─────────┬───────┘    └─────────────────┘
          │ (3. Eligible)
          ▼
┌─────────────────┐
│  Medical        │
│  Assessment     │
└─────────┬───────┘
          │ (4. Assessment)
          ▼
┌─────────────────┐
│  Payment Advice │
│  Generation     │
└─────────┬───────┘
          │ (5. Payment Advice)
          ▼
┌─────────────────┐
│  Payment       │
│  Processing    │
└─────────┬───────┘
          │ (6. Payment)
          ▼
┌─────────────────┐
│  Member        │
│  Notification  │
└─────────────────┘
```

### 8.2 Monitoring & Escalation Workflows

#### 8.2.1 8-Hour Monitoring Workflow

```
┌─────────────────┐
│  Admission      │
│  Trigger        │
└─────────┬───────┘
          │ (1. Admission Recorded)
          ▼
┌─────────────────┐
│  8-Hour Timer   │
│  Started        │
└─────────┬───────┘
          │ (2. 8 Hours Elapsed)
          ▼
┌─────────────────┐
│  Monitoring     │
│  Alert          │
└─────────┬───────┘
          │ (3. Alert Generated)
          ▼
┌─────────────────┐
│  Claims Manager │
│  Assignment     │
└─────────┬───────┘
          │ (4. Manager Assigned)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Contact        │    │  Contact        │
│  Hospital       │───▶│  Patient        │
│                 │    │                 │
│ • Treatment     │    │ • Condition     │
│   Update        │    │   Update        │
│ • Condition     │    │ • Treatment     │
│   Status        │    │   Status        │
└─────────┬───────┘    └─────────┬───────┘
          │ (5. Contact Results) │
          └──────────────────────┘
                      │
                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Medically      │    │  Not Medically   │
│  Accepted       │    │  Accepted       │
└─────────┬───────┘    └─────────┬───────┘
          │ (6. Status)          │ (6. Status)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Update         │    │  Issue MQ       │
│  Monitoring     │    │                 │
│  Status         │    │ • Soft Stop     │
└─────────┬───────┘    │ • Escalate      │
          │            │ • Supervisor    │
          ▼            └─────────────────┘
┌─────────────────┐
│  Continue       │
│  Monitoring     │
└─────────────────┘
```

#### 8.2.2 Length of Stay (LOS) Monitoring Workflow

```
┌─────────────────┐
│  Admission      │
│  Recorded       │
└─────────┬───────┘
          │ (1. Admission Data)
          ▼
┌─────────────────┐
│  LOS Threshold  │
│  Calculation    │
└─────────┬───────┘
          │ (2. Threshold Determined)
          ▼
┌─────────────────┐
│  Daily LOS      │
│  Check          │
└─────────┬───────┘
          │ (3. Daily Check)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  LOS Exceeds    │    │  LOS Within     │
│  Threshold      │───▶│  Threshold      │
└─────────┬───────┘    └─────────┬───────┘
          │ (4. Alert)           │ (4. Continue)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  LOS Alert      │    │  Continue        │
│  Generated      │    │  Monitoring      │
└─────────┬───────┘    └─────────────────┘
          │ (5. Alert)
          ▼
┌─────────────────┐
│  Claims Manager │
│  Review         │
└─────────┬───────┘
          │ (6. Manager Review)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Contact        │    │  No Action       │
│  Hospital       │───▶│  Required        │
│                 │    │                 │
│ • Treatment     │    │ • LOS acceptable│
│   Update        │    │ • Continue care │
│ • Discharge     │    │ • Monitor       │
│   Plan          │    │   daily         │
└─────────┬───────┘    └─────────────────┘
          │ (7. Contact Results)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Medically      │    │  Medically      │
│  Accepted       │    │  Not Accepted   │
└─────────┬───────┘    └─────────┬───────┘
          │ (8. Status)          │ (8. Status)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Update LOS     │    │  Issue MQ       │
│  Status         │    │                 │
│                 │    │ • Soft Stop     │
│ • Continue      │    │ • Escalate      │
│   Monitoring    │    │ • Supervisor    │
└─────────────────┘    └─────────────────┘
```

### 8.3 Investigation Workflow

#### 8.3.1 Medical Investigation Process

```
┌─────────────────┐
│  Investigation  │
│  Trigger        │
└─────────┬───────┘
          │ (1. Trigger Event)
          ▼
┌─────────────────┐
│  Investigation  │
│  Case Creation  │
└─────────┬───────┘
          │ (2. Case Created)
          ▼
┌─────────────────┐
│  Assign         │
│  Investigator   │
└─────────┬───────┘
          │ (3. Assignment)
          ▼
┌─────────────────┐
│  Document       │
│  Request        │
└─────────┬───────┘
          │ (4. Request Sent)
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Document       │    │  Document       │
│  Received       │───▶│  Not Received    │
└─────────┬───────┘    └─────────┬───────┘
          │ (5. Status)          │ (5. Status)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Medical        │    │  Follow-up      │
│  Assessment     │    │  Request        │
└─────────┬───────┘    └─────────┬───────┘
          │ (6. Assessment)      │ (6. Follow-up)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Investigation  │    │  Escalate        │
│  Complete       │    │  Investigation   │
└─────────┬───────┘    └─────────┬───────┘
          │ (7. Results)         │ (7. Escalation)
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Update Claim   │    │  Supervisor      │
│  Status         │    │  Review          │
└─────────────────┘    └─────────────────┘
```

---

## 9. Integration Architecture

### 9.1 External System Integration

#### 9.1.1 Medicare Integration

**Integration Points:**
- Policy data synchronization
- Member information updates
- Endorsement processing
- Coverage validation

**Technical Implementation:**
```typescript
// Medicare API Client
class MedicareClient {
  private readonly baseUrl = process.env.MEDICARE_API_URL;
  private readonly clientId = process.env.MEDICARE_CLIENT_ID;
  private readonly clientSecret = process.env.MEDICARE_CLIENT_SECRET;
  
  async getPolicyDetails(policyNo: string): Promise<PolicyDetails> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/policies/${policyNo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Medicare API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async syncPolicyChanges(): Promise<void> {
    // Daily synchronization job
    const policies = await this.getAllActivePolicies();
    
    for (const policy of policies) {
      await this.updatePolicyInCCMS(policy);
    }
  }
}
```

#### 9.1.2 FWD Integration

**Integration Points:**
- Claim approval/rejection notifications
- Policy cancellation updates
- Payment processing coordination
- SLA monitoring

**Technical Implementation:**
```typescript
// FWD Webhook Handler
class FWDIntegration {
  async handleClaimApproval(webhookData: FWDWebhookData): Promise<void> {
    const { claimId, approvalStatus, approvalDate, notes } = webhookData;
    
    // Update claim status in CCMS
    await this.claimService.updateClaimStatus(
      claimId, 
      approvalStatus, 
      approvalDate, 
      notes
    );
    
    // Trigger notification to member
    await this.notificationService.sendApprovalNotification(claimId);
  }
  
  async handlePolicyCancellation(policyNo: string): Promise<void> {
    // Update policy status to CANCELLED
    await this.policyService.cancelPolicy(policyNo);
    
    // Block all pending claims for this policy
    await this.claimService.blockClaimsForPolicy(policyNo);
    
    // Notify affected members
    await this.notificationService.sendCancellationNotification(policyNo);
  }
}
```

### 9.2 Hospital Integration

#### 9.2.1 Panel Hospital Integration

**Integration Methods:**
- **Real-time GL Issuance:** API-based guarantee letter generation
- **Document Upload:** Secure file transfer for medical documents
- **Status Updates:** Real-time admission/discharge notifications

**API Endpoints:**
```typescript
// Hospital API Endpoints
app.post('/api/hospitals/:id/guarantee-letter', 
  authenticateHospital,
  validateGLRequest,
  async (req: Request, res: Response) => {
    const { hospitalId } = req.params;
    const glRequest = req.body;
    
    try {
      const gl = await guaranteeLetterService.createGL(
        hospitalId, 
        glRequest
      );
      
      res.json({
        success: true,
        glNumber: gl.glNumber,
        validityPeriod: gl.validityPeriod,
        amountLimit: gl.amountLimit
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);
```

#### 9.2.2 Non-Panel Hospital Setup

**Process Flow:**
1. Hospital registration request
2. Document verification
3. Fee schedule setup
4. Bank account verification
5. System activation

**Data Model:**
```typescript
interface NonPanelHospitalSetup {
  hospitalId: string;
  registrationDate: Date;
  documents: DocumentSubmission[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  feeSchedule: FeeSchedule[];
  bankDetails: BankAccount;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}
```

### 9.3 Payment Integration

#### 9.3.1 Bank Integration

**Integration Points:**
- Payment file generation (CSV/XML)
- Bank account validation
- Payment status tracking
- Reconciliation processing

**Implementation:**
```typescript
// Payment File Generation
class PaymentFileService {
  async generatePaymentFile(paymentAdvice: PaymentAdvice[]): Promise<Buffer> {
    const csvData = paymentAdvice.map(pa => ({
      claimId: pa.claimId,
      hospitalId: pa.hospitalId,
      amount: pa.totalAmount,
      bankCode: pa.hospital.bankCode,
      accountNumber: pa.hospital.bankAccount,
      reference: pa.paNumber
    }));
    
    return this.csvGenerator.create(csvData);
  }
  
  async uploadPaymentFile(file: Buffer, bankId: string): Promise<UploadResult> {
    const bankConfig = await this.bankConfigService.getBankConfig(bankId);
    
    const response = await fetch(bankConfig.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bankConfig.apiKey}`,
        'Content-Type': 'text/csv'
      },
      body: file
    });
    
    return response.json();
  }
}
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Foundation (Weeks 1-8)

**Objectives:**
- Set up development environment and infrastructure
- Implement core database schema
- Develop authentication and authorization framework
- Create basic API structure

**Deliverables:**
- [ ] Database schema implementation (78 tables)
- [ ] User management system
- [ ] Role-based access control
- [ ] JWT authentication with httpOnly cookies
- [ ] Basic API endpoints structure
- [ ] Development and staging environments

**Milestones:**
- Week 4: Core database and authentication complete
- Week 6: Basic API endpoints functional
- Week 8: Foundation phase review and approval

### 10.2 Phase 2: Core Claims Processing (Weeks 9-20)

**Objectives:**
- Implement claims registration and management
- Develop admission processing workflows
- Create medical assessment capabilities
- Build investigation module

**Deliverables:**
- [ ] Claims registration and search
- [ ] Admission processing (GL, Pre, Post, MR)
- [ ] Medical assessment workflows
- [ ] Investigation case management
- [ ] Document upload and management
- [ ] Basic reporting capabilities

**Milestones:**
- Week 12: Claims registration complete
- Week 16: Admission processing functional
- Week 20: Core claims processing complete

### 10.3 Phase 3: Financial Management (Weeks 21-28)

**Objectives:**
- Implement payment advice generation
- Develop financial tracking and reporting
- Create stop-loss calculations
- Build FWD accumulation tracking

**Deliverables:**
- [ ] Payment advice generation
- [ ] Multi-payment advice support
- [ ] Financial reporting and analytics
- [ ] Stop-loss calculations
- [ ] FWD accumulation tracking
- [ ] Bank integration

**Milestones:**
- Week 24: Payment advice system complete
- Week 28: Financial management complete

### 10.4 Phase 4: Monitoring & Escalation (Weeks 29-36)

**Objectives:**
- Implement 8-hour monitoring
- Develop LOS monitoring system
- Create escalation workflows
- Build comprehensive reporting

**Deliverables:**
- [ ] 8-hour monitoring alerts
- [ ] Length of stay monitoring
- [ ] Escalation management system
- [ ] Advanced reporting and dashboards
- [ ] SLA tracking and reporting
- [ ] Audit trail enhancements

**Milestones:**
- Week 32: Monitoring systems complete
- Week 36: Escalation and reporting complete

### 10.5 Phase 5: Integration & Deployment (Weeks 37-44)

**Objectives:**
- Integrate with external systems
- Performance optimization
- Security hardening
- User training and deployment

**Deliverables:**
- [ ] Medicare integration
- [ ] FWD integration
- [ ] Hospital integration
- [ ] Performance optimization
- [ ] Security audit and hardening
- [ ] User training materials
- [ ] Production deployment

**Milestones:**
- Week 40: External integrations complete
- Week 42: Performance and security complete
- Week 44: Production deployment

### 10.6 Resource Allocation

**Development Team Structure:**
- **Project Manager:** 1 FTE
- **Technical Lead:** 1 FTE
- **Frontend Developers:** 3 FTE (React/Next.js)
- **Backend Developers:** 4 FTE (Node.js/TypeScript)
- **Database Developer:** 1 FTE (SQL Server)
- **QA Engineers:** 2 FTE
- **DevOps Engineer:** 1 FTE
- **Security Specialist:** 0.5 FTE

**Total Team Size:** 13.5 FTE

### 10.7 Risk Management

**Technical Risks:**
- Database migration complexity
- Integration with legacy systems
- Performance under high load
- Security vulnerabilities

**Mitigation Strategies:**
- Comprehensive testing strategy
- Incremental migration approach
- Performance monitoring and optimization
- Security audits and penetration testing

---

## 11. Risk Mitigation

### 11.1 Technical Risks

#### 11.1.1 Database Migration Risk

**Risk:** Complex migration from 164 legacy tables to 78 normalized tables

**Mitigation Strategy:**
```typescript
// Migration Strategy
class DatabaseMigrationService {
  async migrateLegacyData(): Promise<void> {
    // Phase 1: Schema Migration
    await this.createNewSchema();
    
    // Phase 2: Data Validation
    await this.validateLegacyData();
    
    // Phase 3: Incremental Migration
    await this.migrateInBatches();
    
    // Phase 4: Data Verification
    await this.verifyDataIntegrity();
    
    // Phase 5: Legacy System Decommission
    await this.decommissionLegacyTables();
  }
  
  private async migrateInBatches(): Promise<void> {
    const batchSize = 1000;
    let offset = 0;
    
    while (true) {
      const batch = await this.getLegacyBatch(offset, batchSize);
      if (batch.length === 0) break;
      
      await this.transformAndInsertBatch(batch);
      offset += batchSize;
      
      // Log progress
      console.log(`Migrated ${offset} records`);
    }
  }
}
```

#### 11.1.2 Performance Risk

**Risk:** System performance degradation under high claim volume

**Mitigation Strategy:**
```typescript
// Performance Optimization
class PerformanceOptimizer {
  // Database Optimization
  async optimizeQueries(): Promise<void> {
    // Add strategic indexes
    await this.addIndexes([
      'IX_Claims_Member',
      'IX_Claims_Status', 
      'IX_Admissions_Claim',
      'IX_PaymentAdvice_Claim'
    ]);
    
    // Query optimization
    await this.analyzeQueryPerformance();
    await this.implementQueryCaching();
  }
  
  // Application Optimization
  async optimizeApplication(): Promise<void> {
    // Implement caching
    await this.setupRedisCaching();
    
    // Optimize API responses
    await this.implementPagination();
    await this.addResponseCompression();
    
    // Load balancing
    await this.configureLoadBalancing();
  }
}
```

### 11.2 Compliance Risks

#### 11.2.1 BNM Compliance Risk

**Risk:** Non-compliance with Bank Negara Malaysia insurance regulations

**Mitigation Strategy:**
```typescript
// Compliance Validation
class ComplianceValidator {
  async validateBNMCompliance(): Promise<ComplianceReport> {
    const checks = [
      this.validateHardStops(),
      this.validateAuditTrail(),
      this.validateRoleSegregation(),
      this.validateDataProtection()
    ];
    
    const results = await Promise.all(checks);
    
    return {
      compliant: results.every(r => r.passed),
      issues: results.filter(r => !r.passed),
      recommendations: this.generateRecommendations(results)
    };
  }
  
  private validateHardStops(): ComplianceCheck {
    // Verify all hard stop rules are implemented
    const hardStops = [
      'POLICY_STATUS',
      'WAITING_PERIOD', 
      'ANNUAL_LIMIT',
      'DUPLICATE_ADMISSION'
    ];
    
    const implemented = hardStops.filter(hs => this.isHardStopImplemented(hs));
    
    return {
      name: 'Hard Stop Implementation',
      passed: implemented.length === hardStops.length,
      details: `Implemented: ${implemented.length}/${hardStops.length}`
    };
  }
}
```

#### 11.2.2 Data Security Risk

**Risk:** Data breaches or unauthorized access to sensitive healthcare information

**Mitigation Strategy:**
```typescript
// Security Hardening
class SecurityHardener {
  async implementSecurityMeasures(): Promise<void> {
    // Encryption
    await this.enableDataEncryption();
    
    // Access Control
    await this.implementRBAC();
    await this.setupAuditLogging();
    
    // Network Security
    await this.configureFirewall();
    await this.setupVPNAccess();
    
    // Application Security
    await this.implementInputValidation();
    await this.setupRateLimiting();
    await this.enableSecurityHeaders();
  }
  
  private async enableDataEncryption(): Promise<void> {
    // Database encryption
    await this.database.enableTransparentDataEncryption();
    
    // Application-level encryption for sensitive fields
    await this.encryptSensitiveFields([
      'member.ic_no',
      'member.bank_acc_no',
      'claim.payee_bank_account_no'
    ]);
  }
}
```

### 11.3 Operational Risks

#### 11.3.1 User Adoption Risk

**Risk:** Resistance to change from legacy system to new platform

**Mitigation Strategy:**
```typescript
// User Training and Support
class UserAdoptionService {
  async createTrainingProgram(): Promise<void> {
    // Training materials
    await this.createUserManuals();
    await this.createVideoTutorials();
    await this.createFAQDocumentation();
    
    // Training sessions
    await this.scheduleTrainingSessions();
    await this.setupHelpDeskSupport();
    
    // Change management
    await this.createCommunicationPlan();
    await this.setupUserFeedbackSystem();
  }
  
  private async scheduleTrainingSessions(): Promise<void> {
    const userGroups = [
      { name: 'Claims Managers', count: 50 },
      { name: 'Claims Assessors', count: 100 },
      { name: 'Administrators', count: 30 },
      { name: 'Support Staff', count: 200 }
    ];
    
    for (const group of userGroups) {
      await this.scheduleGroupTraining(group);
    }
  }
}
```

#### 11.3.2 Business Continuity Risk

**Risk:** System downtime affecting critical claims processing operations

**Mitigation Strategy:**
```typescript
// Business Continuity Planning
class BusinessContinuityService {
  async createDisasterRecoveryPlan(): Promise<void> {
    // Backup strategy
    await this.setupAutomatedBackups();
    await this.configureBackupVerification();
    
    // Recovery procedures
    await this.createRecoveryRunbooks();
    await this.setupMonitoringAlerts();
    
    // Testing
    await this.scheduleRecoveryTests();
    await this.createFailoverProcedures();
  }
  
  private async setupAutomatedBackups(): Promise<void> {
    // Database backups
    await this.configureDatabaseBackups({
      frequency: 'HOURLY',
      retention: '30_DAYS',
      location: 'OFFSITE'
    });
    
    // Application backups
    await this.configureApplicationBackups({
      frequency: 'DAILY',
      retention: '7_DAYS'
    });
  }
}
```

---

## 12. Appendices

### 12.1 Glossary

**CCMS:** Comprehensive Care Management System - The new healthcare insurance claims management platform

**TPA:** Third Party Administrator - CC4U acts as TPA managing claims on behalf of Medicare and FWD

**GL:** Guarantee Letter - Cashless hospital admission authorization

**LOS:** Length of Stay - Duration of hospital admission

**IX:** Investigation - Medical investigation case management

**PEC:** Pre-existing Condition - Medical conditions existing before policy coverage

**BNM:** Bank Negara Malaysia - Malaysian central bank and financial regulator

**Medicare:** Policy administrator managing CUEPACS member policies

**FWD:** Insurer providing coverage and final approval authority

### 12.2 Acronyms

- **API:** Application Programming Interface
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token
- **SQL:** Structured Query Language
- **SSR:** Server-Side Rendering
- **SPA:** Single Page Application
- **SOP:** Standard Operating Procedure
- **SLA:** Service Level Agreement
- **VPN:** Virtual Private Network
- **SSL/TLS:** Secure Sockets Layer/Transport Layer Security

### 12.3 Technical Specifications

#### 12.3.1 System Requirements

**Minimum Hardware Requirements:**
- **Web Servers:** 4 CPU cores, 8GB RAM, 100GB storage
- **Application Servers:** 8 CPU cores, 16GB RAM, 200GB storage
- **Database Server:** 16 CPU cores, 64GB RAM, 1TB storage
- **Cache Server:** 4 CPU cores, 8GB RAM, 50GB storage

**Software Requirements:**
- **Operating System:** Windows Server 2019+ or Linux Ubuntu 20.04+
- **Database:** SQL Server 2019+ or PostgreSQL 13+
- **Runtime:** Node.js 18+ with TypeScript
- **Web Server:** Nginx or IIS
- **Cache:** Redis 6+

#### 12.3.2 Performance Benchmarks

**Expected Performance Metrics:**
- **Response Time:** < 2 seconds for 95% of requests
- **Concurrent Users:** Support 500+ concurrent users
- **Claims Processing:** 100+ claims per minute
- **Database Queries:** < 100ms for 90% of queries
- **Uptime:** 99.5% availability

### 12.4 Contact Information

**Project Team Contacts:**
- **Project Manager:** [Name, Email, Phone]
- **Technical Lead:** [Name, Email, Phone]
- **Security Lead:** [Name, Email, Phone]
- **QA Lead:** [Name, Email, Phone]

**Stakeholder Contacts:**
- **Medicare Representative:** [Name, Email, Phone]
- **FWD Representative:** [Name, Email, Phone]
- **CC4U Management:** [Name, Email, Phone]

---

**Document Version:** 1.0  
**Last Updated:** March 19, 2026  
**Next Review:** June 2026  

*This document is confidential and intended for authorized personnel only.*