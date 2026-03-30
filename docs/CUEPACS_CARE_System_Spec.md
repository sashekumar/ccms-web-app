# CUEPACS CARE System — New Development Specification

> **Source:** CC4U Functional Flow Document v0.6 (27 September 2024)
> **Client:** Medicare Sdn Bhd | **Prepared by:** United Asian Consultants Sdn Bhd
> **Purpose:** This document translates the legacy CUEPACS CARE system's functional design into a structured specification for new web-based system development. Use this as the authoritative reference for GitHub Copilot-assisted development.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture Guidance](#2-system-architecture-guidance)
3. [Authentication Module](#3-authentication-module-cc-login)
4. [Dashboard & Navigation](#4-dashboard--navigation-cc-home)
5. [Policy Holder Module](#5-policy-holder-module-cc-ph)
6. [Claim Assignment Module](#6-claim-assignment-module-cc-ca)
7. [Processing Module](#7-processing-module-cc-pr--cc-ad)
8. [Monitoring Module](#8-monitoring-module)
9. [Escalation Module](#9-escalation-module)
10. [Settlement Module](#10-settlement-module)
11. [Reports Module](#11-reports-module)
12. [Known Legacy Issues to Fix](#12-known-legacy-issues-to-fix)
13. [Data Models & DB Reference](#13-data-models--db-reference)
14. [Role-Based Access Control](#14-role-based-access-control-rbac)
15. [Error Handling Standards](#15-error-handling-standards)

---

## 1. Project Overview

### Objective

Rebuild the CUEPACS CARE system as a modern **web-based platform** using a contemporary technology stack, preserving all existing business logic and correcting known defects from the legacy system.

### Goals

- Replicate all core functional modules as described in this document
- Fix all known crashes, broken modules, and DB query issues documented in legacy FD
- Implement proper error handling and user access control throughout
- Build a scalable web equivalent (SPA or SSR) of the current desktop/legacy platform
- Reference a separate DB Addendum document for stored procedures and full table schemas

### System Domain

Healthcare insurance claims management platform for CUEPACS (government employees union) members managed by Medicare Sdn Bhd. Core operations include GL (Guarantee Letter) issuance, admissions, discharge management, claim processing, escalation workflows, settlement, and reporting.

### Claim Types

| Code | Description |
|------|-------------|
| GL   | Guarantee Letter (cashless hospital admission) |
| Pre  | Pre-Authorization |
| Post | Post-Hospitalization claim |
| MR   | Medical Report claim |
| RL   | Reimbursement Letter |

---

## 2. System Architecture Guidance

### Recommended New Stack

```
Frontend:   React / Next.js (SPA or SSR)
Backend:    Node.js (Express) or .NET Core Web API
Database:   SQL Server (migrate from legacy DB, refer to DB Addendum)
Auth:       JWT-based session with role-based access
Reports:    PDF generation + XLS/CSV export capability
Comms:      Email (SMTP) and SMS notification services
```

### High-Level Module Map

```
CUEPACS CARE
├── Authentication
├── Dashboard (Home)
├── Policy Holder
│   ├── View Policy Holders
│   ├── View Claim History
│   └── View Customer Service
├── Claim Assignment
│   ├── Assignment
│   └── Monitoring
├── Processing
│   ├── Registration (New / View / Edit)
│   ├── Reimbursement
│   │   ├── Approval (Confirmation GL/RL)
│   │   └── Documentation (Reminder / View / Print / Re-Print / Final)
│   ├── Investigation
│   ├── Admission (GL / Pre / Post / MR / View-Edit)
│   ├── Discharge (New / View-Edit)
│   ├── ICD Classification (New / Edit)
│   ├── Questionnaire
│   ├── Monitoring (8 Hours / LOS / Deferment)
│   ├── Non-Panel Setup
│   ├── Panel Contacts
│   └── Escalation
│       ├── Operation (Admission / Discharge / 8Hr / LOS)
│       ├── Management (Admission / Discharge)
│       ├── Assurance (Admission / Discharge)
│       ├── Compliance (Assignment / Review)
│       ├── Settlement (Liaison / Settlement / Management / Assurance)
│       └── Admin
└── Settlement
    ├── Submission
    │   ├── Last Doc Received Date
    │   ├── Claims (Sun Life)
    │   ├── Reimbursement Repudiation
    │   └── Claim Upload (Submission / Decline / KIV / Search / Export / Status / File Generation)
    ├── Payment (New / Edit / Print Cheque / Upload / Send Mail)
    └── Reports
        ├── Hospital Reports
        ├── Common Reports
        └── Management Reports
```

---

## 3. Authentication Module (`CC-LOGIN`)

### Functional Spec

| Field       | Detail |
|-------------|--------|
| **Route**   | `/login` |
| **Inputs**  | `username` (string), `password` (string) |
| **Success** | Redirect to Dashboard (`/home`) |
| **Failure** | Show inline error; remain on login page |

### Business Logic

- Validate credentials against user store
- On success: load user profile object + permissions/access rights into session/token
- On failure: display message `"Invalid User ID or Password"`
- Do NOT expose which field is incorrect (security best practice)

### Implementation Notes

```typescript
// Auth flow pseudocode
POST /api/auth/login
  body: { username: string, password: string }
  response:
    200: { token: JWT, user: { id, name, roles[], permissions[] } }
    401: { error: "Invalid User ID or Password" }
```

- Use JWT or session-based auth
- Store permissions in token payload for frontend access control
- Implement token refresh mechanism
- Add rate limiting on login endpoint to prevent brute force

---

## 4. Dashboard & Navigation (`CC-HOME`)

### Landing Page

| Field      | Detail |
|------------|--------|
| **Route**  | `/home` or `/dashboard` |
| **Access** | Authenticated users only |

### Business Logic

- On login, load user info and access permissions
- Render menu items dynamically based on user's assigned roles/permissions
- If user attempts to access an unauthorized screen, show: `"You are not authorized to access this screen!"`
- Menu items without sub-items navigate directly to their action form

### Menu Tree Structure

Build a hierarchical, collapsible navigation component:

```
Policy Holder
  ├── View Policy Holders
  ├── View Claim History
  └── View Customer Service

Claim Assignment
  ├── Assignment
  └── Monitoring

Processing
  ├── Registration
  │   ├── New
  │   └── View / Edit
  ├── Reimbursement
  │   ├── Approval
  │   │   ├── Confirmation GL/RL
  │   │   └── Edit Confirmation GL/RL
  │   └── Documentation
  │       ├── Reminder
  │       ├── View Reminder
  │       ├── Print Reminder
  │       ├── Re Print
  │       └── Final Reminder
  ├── Investigation
  ├── Admission
  │   ├── New (GL)
  │   ├── New (Pre)
  │   ├── New (Post)
  │   ├── New (MR)
  │   └── View / Edit
  ├── Discharge
  │   ├── New
  │   └── View / Edit
  ├── ICD Classification
  │   ├── New
  │   └── Edit
  ├── Questionnaire
  ├── Monitoring
  │   ├── 8 Hours
  │   ├── Length of Stay
  │   └── Deferment
  ├── Non-Panel Setup
  ├── Panel Contacts
  └── Escalation
      ├── Operation
      │   ├── Admission
      │   ├── Discharge
      │   ├── 8 Hour Monitoring
      │   └── LOS Monitoring
      ├── Management
      │   ├── Admission
      │   └── Discharge
      ├── Assurance
      │   ├── Admission
      │   └── Discharge
      ├── Compliance
      │   ├── Assignment
      │   └── Review
      ├── Settlement
      │   ├── Liaison
      │   ├── Settlement
      │   ├── Management
      │   └── Assurance
      └── Admin

Settlement
  ├── Submission
  │   ├── Last Doc Received Date
  │   │   ├── Update
  │   │   └── Edit
  │   ├── Claims (Sun Life)
  │   ├── Reimbursement Repudiation
  │   └── Claim Upload
  │       ├── Submission (Approved / Decline / KIV)
  │       ├── Error Listing
  │       ├── Search Claim
  │       ├── Export Payment File
  │       ├── Claim Upload Status
  │       └── Regenerate Claim Upload File
  │           ├── Notification
  │           ├── Adjustment Error
  │           ├── Adjustment Successful
  │           └── Offer
  ├── Payment
  │   ├── New
  │   ├── View / Edit
  │   ├── Print Cheque (Policy Holder / Hospitals)
  │   ├── Upload
  │   └── Send Mail to Hospital
  └── Reports
      ├── Hospital Reports
      │   ├── Statement of Account
      │   ├── Pending Docs Reminder
      │   ├── Pending Claims
      │   └── Claim Summary
      ├── Common Reports
      │   ├── Claims
      │   ├── Activity (By Time / By User / By Weekday)
      │   ├── TAT Report
      │   ├── SMS (Pending / Sent)
      │   ├── Discount Report
      │   ├── Report By Reg Date
      │   ├── Document Clean Up
      │   └── Escalation
      └── Management Reports
          ├── Summary (Exceed Avg Claim Size / LOS / By Illness / Policies by Agent)
          ├── Other (Delay Issues / Cost Containment / Audit / Pending*)
          ├── SLA (MQ / Deferment / Discount / Ageing / Summary)
          ├── Case Study
          ├── Master File Export
          ├── Claim Stop Loss Report
          ├── Claim Analysis with Policy First Start Date
          └── Document Clean Up - Tracking
```

---

## 5. Policy Holder Module (`CC-PH`)

### 5.1 View Policy Holders (`CC-PH02`)

| Field       | Detail |
|-------------|--------|
| **Route**   | `/policy-holder/view` |
| **Access**  | Permission required |

**Search Fields:**
- IC (New) — identity card number
- Full Name — partial match supported
- Show All — default view

**Business Logic:**
- Search is triggered by user input; support partial name matching
- Results displayed in a paginated list
- Selecting a record opens the policy holder detail view

**API Endpoints to Build:**
```
GET /api/policy-holders?search=&searchBy=[IC|Name|All]
GET /api/policy-holders/:id
```

---

### 5.2 View Claim History (`CC-PH03`)

| Field       | Detail |
|-------------|--------|
| **Route**   | `/policy-holder/claim-history` |

**Views:**
- List of Claim History (paginated)
- Search Claim History
- View GL (Guarantee Letter detail)

**Business Logic:**
- User selects a record → click OK → opens claim history detail
- Support viewing GL information linked to a claim

**API Endpoints to Build:**
```
GET /api/claim-history?patientId=&searchBy=
GET /api/claim-history/:claimId
GET /api/claim-history/:claimId/gl
```

---

### 5.3 View Customer Service (`CC-PH04`)

| Field       | Detail |
|-------------|--------|
| **Route**   | `/policy-holder/customer-service` |

**Search Fields:**
- Full Name — supports partial match (e.g. searching "HALIMAH" returns all records containing that string)
- Additional search criteria via dropdown

**Business Logic:**
- User selects search type from dropdown, enters value, clicks GO
- Partial name match must be implemented server-side (LIKE query or equivalent)

**API Endpoints to Build:**
```
GET /api/customer-service?search=&searchBy=[FullName|IC|...]
```

---

## 6. Claim Assignment Module (`CC-CA`)

### 6.1 Claim Assignment (`CC-CA01`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/claim-assignment/assignment` |

> ⚠️ **Legacy Issue:** System was crashing on load — connectivity/data loading failures. New implementation must include proper loading states, error boundaries, and retry logic.

**Business Logic:**
- Load list of claims eligible for assignment
- Assign claims to agents/handlers per business rules

**API Endpoints to Build:**
```
GET  /api/claim-assignment
POST /api/claim-assignment/:claimId/assign  body: { assignedTo: userId }
```

---

### 6.2 Claim Monitoring (`CC-CA02`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/claim-assignment/monitoring` |

**Business Logic:**
- Display active claims being monitored
- Show claim status and timeline

---

## 7. Processing Module (`CC-PR` / `CC-AD`)

### 7.1 Processing Registration (`CC-PR01`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/registration/new` |

> ⚠️ **Legacy Issue:** System crashed when opening individual records. Root cause: empty record trimming and missing try-catch in DB query. New system must implement proper null checks and error handling for all DB reads.

**Business Logic:**
- Search policy holder by IC or Full Name
- Select policy holder → create new registration record
- Capture: claim type, patient details, hospital, dates

**API Endpoints to Build:**
```
GET  /api/registration?search=&searchBy=[IC|Name]
POST /api/registration          body: { policyHolderId, claimType, ... }
GET  /api/registration/:id
PUT  /api/registration/:id
```

---

### 7.2 View / Edit Processing Registration (`CC-PR02`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/registration` |

**Search Fields:** Patient IC, Patient Name, Hospital Name

**Business Logic:**
- Paginated list of registrations
- Search and filter support
- Select record → open detail form for viewing or editing
- Save changes on edit

---

### 7.3 Reimbursement Approval – Confirmation GL/RL (`CC-PR03`, `CC-PR04`)

| Route (New)  | `/processing/reimbursement/approval/confirmation` |
| Route (Edit) | `/processing/reimbursement/approval/edit-confirmation` |

**Business Logic:**
- View claim records pending GL/RL confirmation
- Submit confirmation or edit and resubmit
- Distinguish between GL (Guarantee Letter) and RL (Reimbursement Letter) flows

---

### 7.4 Documentation Sub-Module

All documentation screens share a common pattern:

| Screen | Route | Action |
|--------|-------|--------|
| Reminder | `/processing/reimbursement/documentation/reminder` | View & update reminder records |
| View Reminder | `/processing/reimbursement/documentation/view-reminder` | View only |
| Print Reminder | `/processing/reimbursement/documentation/print-reminder` | View Pending/Completed + print |
| Re Print | `/processing/reimbursement/documentation/reprint` | View & re-print |
| Final Reminder | `/processing/reimbursement/documentation/final-reminder` | View only |

**Common API Pattern:**
```
GET  /api/documentation/reminders?status=[Pending|Completed]
PUT  /api/documentation/reminders/:id
POST /api/documentation/reminders/:id/print
```

---

### 7.5 Investigation (`CC-INVESTIGATION`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/reimbursement/investigation` |

> ⚠️ **Legacy Issue:** Module not functioning as intended. Build from scratch with full functionality.

**Business Logic:**
- Open investigation cases linked to a claim
- Record investigation findings and outcomes

---

### 7.6 Admission Module (`CC-AD01` to `CC-AD04`)

#### New Admission – GL (`CC-AD01`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/admission/new/gl` |

**Business Logic:**
- Select policy holder record
- Issue a Guarantee Letter for hospital admission
- Capture: hospital, diagnosis, estimated amount, admission date

#### New Admission – Pre / Post / MR (`CC-AD02`)

| Routes |
|--------|
| `/processing/admission/new/pre` |
| `/processing/admission/new/post` |
| `/processing/admission/new/mr` |

**Business Logic:**
- Pre: Pre-authorization request before hospitalization
- Post: Post-hospitalization claim submission
- MR: Medical report claim

> ⚠️ **Legacy Issue (`CC-AD03`, `CC-AD04`):** POST and MR admission types caused system crashes. Must be implemented fresh with full validation and error boundaries.

#### Admission View / Edit

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/admission/view-edit` |

**Business Logic:**
- Multi-tab interface for viewing and editing admission records
- Tabs cover: Basic Info, Clinical Details, GL Details, Documents, History
- Save on tab-level or global save button

**API Endpoints to Build:**
```
GET  /api/admissions?search=&searchBy=[IC|Name|Hospital]
POST /api/admissions              body: { type: GL|Pre|Post|MR, ... }
GET  /api/admissions/:id
PUT  /api/admissions/:id
```

---

### 7.7 Discharge Module

#### New Discharge

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/discharge/new` |

**Business Logic:**
- List claim records with search (Patient IC, Name, Hospital)
- Select record → fill discharge form → create discharge summary
- Capture: discharge date, final diagnosis, total bill, discharge status

#### View / Edit Discharge

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/discharge/view-edit` |

**Business Logic:**
- Search and list discharge records
- Open, edit fields, update discharge summary

**API Endpoints to Build:**
```
GET  /api/discharges?search=&searchBy=
POST /api/discharges         body: { admissionId, dischargeDate, finalDiagnosis, totalBill, ... }
GET  /api/discharges/:id
PUT  /api/discharges/:id
```

---

### 7.8 ICD Classification

#### New ICD Classification

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/icd-classification/new` |

**Business Logic:**
- Select claim record
- Choose ICD classification from dropdown
- Submit classification

#### Edit ICD Classification

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/icd-classification/edit` |

**API Endpoints to Build:**
```
GET  /api/icd-classifications?claimId=
POST /api/icd-classifications      body: { claimId, icdCode, icdDescription }
PUT  /api/icd-classifications/:id
```

---

### 7.9 Questionnaire (`CC-QUESTIONAIRE`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/questionnaire` |

**Business Logic:**
- Search by Patient Name or IC
- Select record → click "Issue Question"
- Questionnaire form is presented for data capture and submission

---

### 7.10 Non-Panel Setup

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/non-panel-setup` |

**Business Logic:**
- Display list of non-panel hospitals and their status
- Read-only listing (no primary business flow)

---

### 7.11 Panel Contacts

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/panel-contacts` |

**Business Logic:**
- Search hospitals
- Two tabs: Hospitals list | Contact listing
- Read-only reference information

---

## 8. Monitoring Module

### 8.1 8-Hour Monitoring (`CC-MONITORING-01`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/monitoring/8-hours` |

**Business Logic:**
- Search by Patient Name, IC, or Hospital Name
- Multi-tab interface for monitoring actions
- Track patients who have been admitted for 8+ hours and require follow-up

**Tabs to Implement:** (Based on legacy system multi-tab pattern)
- Current Monitoring List
- Pending Action
- Completed

---

### 8.2 Length of Stay Monitoring (`CC-MONITORING-02`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/monitoring/length-of-stay` |

**Business Logic:**
- Search by Patient Name or IC
- Display recent records by default
- Monitor patients exceeding expected length of stay

---

### 8.3 Deferment Monitoring (`CC-MONITORING-03`)

| Field      | Detail |
|------------|--------|
| **Route**  | `/processing/monitoring/deferment` |

**Business Logic:**
- Display deferment list
- Multi-tab interface: choose action for each deferment
- Track claims where decisions have been deferred

**API Endpoints (Monitoring):**
```
GET /api/monitoring/8-hours?search=&searchBy=
GET /api/monitoring/length-of-stay?search=&searchBy=
GET /api/monitoring/deferment
PUT /api/monitoring/deferment/:id   body: { action, notes }
```

---

## 9. Escalation Module

All escalation sub-modules follow a **common pattern**:

**Common Business Logic:**
- Search by Patient Name, IC, or Hospital Name
- List of records loaded based on escalation category
- Select record → assign or take action per business rules
- Update outcome/status

**Common API Pattern:**
```
GET  /api/escalations/:type?search=&searchBy=
PUT  /api/escalations/:type/:id   body: { outcome, assignedTo, notes }
```

### Escalation Sub-Modules

| Module | Route | Description |
|--------|-------|-------------|
| Operation – Admission | `/processing/escalation/operation/admission` | Escalated admission claims |
| Operation – Discharge | `/processing/escalation/operation/discharge` | Escalated discharge claims |
| Operation – 8Hr Monitoring | `/processing/escalation/operation/8-hour-monitoring` | Escalated monitoring cases |
| Operation – LOS Monitoring | `/processing/escalation/operation/los-monitoring` | Escalated LOS cases |
| Management – Admission | `/processing/escalation/management/admission` | Management review of admissions |
| Management – Discharge | `/processing/escalation/management/discharge` | Management review of discharges |
| Assurance – Admission | `/processing/escalation/assurance/admission` | Assurance team admission review |
| Assurance – Discharge | `/processing/escalation/assurance/discharge` | Assurance team discharge review |
| Compliance – Assignment | `/processing/escalation/compliance/assignment` | Assign claims to compliance officers |
| Compliance – Review | `/processing/escalation/compliance/review` | Review compliance outcomes |
| Settlement – Liaison | `/processing/escalation/settlement/liaison` | Settlement liaison management |
| Settlement – Settlement | `/processing/escalation/settlement/settlement` | Final settlement action |
| Settlement – Management | `/processing/escalation/settlement/management` | Management settlement view |
| Settlement – Assurance | `/processing/escalation/settlement/assurance` | Assurance settlement view |
| Admin | `/processing/escalation/admin` | Admin escalation (⚠️ legacy produced no records) |

---

## 10. Settlement Module

### 10.1 Submission – Last Doc Received Date

| Sub-module | Route |
|------------|-------|
| Update | `/settlement/submission/last-doc-received/update` |
| Edit   | `/settlement/submission/last-doc-received/edit` |

**Business Logic:**
- Search and update the last document received date for a claim
- Critical for SLA tracking

---

### 10.2 Submission – Claims (Sun Life)

| Field      | Detail |
|------------|--------|
| **Route**  | `/settlement/submission/claims-sun-life` |

> ⚠️ **Legacy Issue:** Module not working. Must be fully implemented in new system.

**Business Logic:**
- View and submit Sun Life insurer claims

---

### 10.3 Submission – Reimbursement Repudiation

| Field      | Detail |
|------------|--------|
| **Route**  | `/settlement/submission/reimbursement-repudiation` |

**Business Logic:**
- View reimbursement records
- Submit repudiation (rejection/decline) with reason

---

### 10.4 Claim Upload Sub-Module

| Sub-module | Route | Notes |
|------------|-------|-------|
| Submission (Approved) | `/settlement/submission/claim-upload/approved` | Multi-tab: select claim type + admission type |
| Decline | `/settlement/submission/claim-upload/decline` | Declined claims |
| KIV | `/settlement/submission/claim-upload/kiv` | Keep In View — no further action needed |
| Error Listing | `/settlement/submission/claim-upload/error-listing` | ⚠️ Legacy: no records populated |
| Search Claim | `/settlement/submission/claim-upload/search` | Search with criteria |
| Export Payment File | `/settlement/submission/claim-upload/export-payment` | Export as XLS |
| Claim Upload Status | `/settlement/submission/claim-upload/status` | Export XLS or show "no records" |

#### Regenerate Claim Upload File

| File Type | Route |
|-----------|-------|
| Notification | `/settlement/submission/claim-upload/regenerate/notification` |
| Adjustment Error | `/settlement/submission/claim-upload/regenerate/adjustment-error` |
| Adjustment Successful | `/settlement/submission/claim-upload/regenerate/adjustment-successful` |
| Offer | `/settlement/submission/claim-upload/regenerate/offer` |

**Common Business Logic (File Generation):**
- Select insurer from dropdown
- Provide file path / output location
- Enter required values
- Click Generate → system produces the file

---

### 10.5 Payment Sub-Module

| Sub-module | Route | Description |
|------------|-------|-------------|
| New Payment | `/settlement/payment/new` | Select record, enter amount, make payment |
| View / Edit | `/settlement/payment/view-edit` | View or modify existing payment |
| Print Cheque | `/settlement/payment/print-cheque` | Print for Policy Holder or Hospital |
| Upload | `/settlement/payment/upload` | Upload payment file |
| Send Mail to Hospital | `/settlement/payment/send-mail` | Select payments → send notification email to hospitals |

**API Endpoints to Build:**
```
GET  /api/payments?search=
POST /api/payments              body: { claimId, amount, paymentType, ... }
PUT  /api/payments/:id
POST /api/payments/:id/print-cheque   body: { recipient: PolicyHolder|Hospital }
POST /api/payments/upload       body: FormData (file)
POST /api/payments/send-mail    body: { paymentIds: [], hospitalIds: [] }
```

---

## 11. Reports Module

### 11.1 Hospital Reports

| Report | Description |
|--------|-------------|
| Statement of Account | Detailed account statement per hospital |
| Pending Docs Reminder | Hospitals with pending document submission |
| Pending Claims | Claims not yet processed per hospital |
| Claim Summary | Summary of all claims per hospital |

---

### 11.2 Common Reports

| Report | Parameters |
|--------|------------|
| Claims Report | Date range, claim type, status |
| Activity – By Time | Date range |
| Activity – By User | User, date range |
| Activity – By Weekday | Date range |
| TAT (Turnaround Time) Report | Date range, module |
| SMS Pending | — |
| SMS Sent | Date range |
| Discount Report | Date range |
| Report By Reg Date | Registration date range |
| Document Clean Up | Date range |
| Escalation Report | Date range, type |

---

### 11.3 Management Reports

#### Summary Reports
- Exceed Average Claim Size
- Exceed Average LOS (Length of Stay)
- By Illness
- Policies and Claims By Agent
- Claims within 9 Months From Start Date By Agent

#### Other Reports
- Delay / Issues Details
- Cost Containment Details
- Audit Report
- Online Reject Reimbursement Approved
- View Claims Update
- Pending Claims
- Pending Payment
- Pending Submission
- Pending Doc Reminder
- Submission Preparation
- FDM (Fund Disbursement Management)
- Claimant Details
- View Customer Service (OLD)

#### SLA Reports
- MQ
- Deferment
- Discount
- New Ageing Decline/Non-Covered Charges
- SLA Summary

#### Other Management Reports
- Case Study
- Master File Export (New / 2010–2011 Online, Reimbursement)
- Claim Stop Loss Report
- Claim Analysis with Policy First Start Date
- Document Clean Up – Tracking

**Report API Pattern:**
```
GET /api/reports/:reportType?params=...
  → returns: JSON data for display + option to export PDF/XLS
POST /api/reports/:reportType/export   body: { format: PDF|XLS, params }
```

---

## 12. Known Legacy Issues to Fix

The following issues were explicitly documented in the legacy FD. All must be resolved in the new system:

| Module | Legacy Issue | New System Requirement |
|--------|-------------|----------------------|
| `CC-CA01` Claim Assignment | System crashes on load (connectivity/data loading failure) | Implement loading states, error boundaries, retry logic |
| `CC-PR01` Processing Registration | Crashes when opening individual records; empty record trim bug; DB query error | Add null checks, try-catch around all DB reads, validate before render |
| `CC-AD03` Admission – POST | System crashes | Build fresh with full validation |
| `CC-AD04` Admission – MR | System crashes | Build fresh with full validation |
| `CC-INVESTIGATION` | Not working as intended | Rebuild module from scratch |
| Submission – Claims (Sun Life) | Module not working | Implement fully |
| Claim Upload – Error Listing | No records populated | Investigate data linkage; implement and validate |
| Escalation – Admin | No records populated | Investigate and implement |

---

## 13. Data Models & DB Reference

> ⚠️ Full DB schema, stored procedures, and table definitions are in the **separate DB Addendum document**. Reference it alongside this spec during development.

### Core Entities (Inferred from Functional Flow)

```typescript
// Policy Holder
interface PolicyHolder {
  id: string;
  fullName: string;
  icNumber: string;      // Identity Card number
  fwdClientNumber: string;
  policyNumber: string;
  // ... refer to DB Addendum for full schema
}

// Claim
interface Claim {
  id: string;
  policyHolderId: string;
  claimType: 'GL' | 'Pre' | 'Post' | 'MR' | 'RL';
  status: string;
  hospitalId: string;
  admissionDate: Date;
  dischargeDate?: Date;
  icdCode?: string;
  totalBill?: number;
  registrationDate: Date;
  assignedTo?: string;     // User ID
  escalationLevel?: string;
  // ... refer to DB Addendum for full schema
}

// Hospital
interface Hospital {
  id: string;
  name: string;
  type: 'Panel' | 'NonPanel';
  contactInfo: ContactInfo;
  bankDetails: BankDetails;
}

// Payment
interface Payment {
  id: string;
  claimId: string;
  amount: number;
  paymentType: 'Cheque' | 'Bank Transfer';
  recipient: 'PolicyHolder' | 'Hospital';
  status: 'Pending' | 'Processed' | 'Sent';
  chequeNumber?: string;
  paymentDate?: Date;
}

// User
interface User {
  id: string;
  username: string;
  name: string;
  roles: string[];
  permissions: string[];
  department: string;
}
```

---

## 14. Role-Based Access Control (RBAC)

### Access Levels (Inferred from System)

| Role | Access Scope |
|------|-------------|
| Operation | Admission, Discharge, 8Hr Monitoring, LOS Monitoring escalations |
| Management | Management-level escalation views |
| Assurance | Assurance escalation views |
| Compliance | Compliance assignment and review |
| Settlement | Settlement submission, payment, and liaison |
| Admin | Full system access including Admin escalation |
| Reports | Access to common and management reports |

### Permission Guard (Frontend)

```typescript
// Implement permission checks on every protected route
const ProtectedRoute = ({ requiredPermission, children }) => {
  const { permissions } = useAuth();
  if (!permissions.includes(requiredPermission)) {
    return <Alert message="You are not authorized to access this screen!" />;
  }
  return children;
};
```

### Permission Guard (Backend)

```typescript
// Middleware to validate user permissions
const requirePermission = (permission: string) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

---

## 15. Error Handling Standards

Apply consistently across all modules in the new system:

### Frontend

```typescript
// Error boundary for each major module
// Loading states with skeleton UI
// Empty state messages ("No records found")
// Retry buttons for failed API calls
// Toast notifications for success/error operations

const ErrorMessage = {
  UNAUTHORIZED: "You are not authorized to access this screen!",
  INVALID_CREDENTIALS: "Invalid User ID or Password",
  NO_RECORDS: "No records found",
  SYSTEM_ERROR: "An error occurred. Please try again.",
};
```

### Backend

```typescript
// All DB queries wrapped in try-catch
// Null/empty record checks before processing
// Proper HTTP status codes (400, 401, 403, 404, 500)
// Structured error response: { error: string, code: string, details?: any }
// Input validation on all endpoints
// DB connection pool management with reconnect logic
```

### Common API Response Format

```typescript
// Success
{ success: true, data: any, meta?: { total, page, pageSize } }

// Error
{ success: false, error: string, code: string }
```

---

## Appendix: Search Pattern Reference

Most list screens in the system follow a standard search pattern. Implement as a reusable component:

```
SearchBar:
  - SearchType: Dropdown [IC | Full Name | Hospital Name | Show All]
  - SearchValue: Text Input
  - GO / Search Button
  - Results: Paginated Table
  - Row Click: Navigate to detail / action screen
```

## Appendix: Export Pattern Reference

Multiple modules support file export:

```
ExportOptions:
  - Format: [XLS | PDF]
  - Filters: Module-specific
  - Generate / Export Button
  - Download triggered on success
```

---

*End of Specification — Reference DB Addendum for full table schemas and stored procedures.*
