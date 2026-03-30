# CCMS System Roles & Responsibilities

**Document Version:** 1.0  
**Date:** March 23, 2026  
**Prepared for:** Medicare Sdn Bhd  
**Purpose:** Define all user roles and module access for CCMS implementation

---

## ALL SYSTEM ROLES

### System Administration Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 1 | **Super Administrator** | Complete system control - manages users, roles, permissions, and technical configurations |
| 2 | **System Administrator** | Day-to-day user account management, password resets, and lookup data maintenance |

### Claims Operations Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 3 | **Claims Handler** | Front-line staff who register claims, create admissions, and enter patient data |
| 4 | **Assessor** | Review admission requests, verify eligibility, and prepare cases for medical approval |
| 5 | **Submission Team** | Process admission submissions and handle hospital coordination |
| 6 | **Senior Claims Handler** | Handle complex claims, resolve discrepancies, and train junior staff |
| 7 | **Claims Supervisor** | Supervise claims team, assign workload, and approve claims within authority limit |

### Medical & Clinical Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 8 | **Medical Officer (MO)** | Assess medical necessity, approve/deny admissions, and issue medical queries |
| 9 | **Senior Medical Officer** | Review complex medical cases, final medical authority, and oversee MO decisions |

### Financial & Settlement Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 10 | **Settlement Officer** | Generate payment advice, process hospital payments, and handle reimbursements |
| 11 | **Finance Officer** | Process payments, verify bank accounts, and upload payment files |
| 12 | **Finance Manager** | Approve payment batches, review settlements, and manage financial operations |

### Investigation & Compliance Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 13 | **Investigation Officer (IX Team)** | Investigate suspicious claims, request documentation, and prepare investigation reports |
| 14 | **Investigation Manager** | Oversee investigations, approve closures, and make final recommendations |
| 15 | **Compliance Officer** | Monitor BNM compliance, audit processes, and prepare regulatory reports |
| 16 | **Audit Team** | Review and audit all claims processes for compliance and quality assurance |

### Management & Oversight Roles

| # | Role Name | What This Role Does |
|---|-----------|---------------------|
| 17 | **Escalation Manager** | Handle escalated cases, approve exceptions, and resolve complex disputes |
| 18 | **Operations Director** | Strategic oversight of all operations, approve high-value claims, and set policies |
| 19 | **Customer Service** | Handle member inquiries, complaints, and reimbursement claim registration |
| 20 | **Report Viewer** | Generate reports, analyze data, and create dashboards (read-only access) |
| 21 | **External Auditor** | Temporary access for external audits and regulatory reviews (read-only) |

---

## MODULE ACCESS MATRIX

**Legend:**
- ✅ = Full Access (Create, View, Update)
- 👁️ = View Only
- 🔐 = Approve/Reject Authority
- ❌ = No Access

| Module | Super Admin | System Admin | Claims Handler | Assessor | Submission | Senior Handler | Supervisor | Medical Officer | Senior MO | Settlement | Finance | Finance Mgr | IX Officer | IX Manager | Compliance | Audit Team | Escalation Mgr | Ops Director | Customer Service | Report Viewer | External Auditor |
|--------|-------------|--------------|----------------|----------|------------|----------------|------------|-----------------|-----------|------------|---------|-------------|------------|------------|------------|------------|----------------|--------------|------------------|---------------|------------------|
| **System Administration** |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ | ❌ |
| Role Management | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ | ❌ |
| Permission Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lookup Data | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| **Dashboard** |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Claims Management** |
| Claim Registration | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Admission (GL/Pre/Post) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 🔐 | 🔐 | ✅ | 👁️ | 👁️ |
| Discharge Management | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Medical Queries | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| Reimbursement Claims | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | 🔐 | 🔐 | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Monitoring & Workflow** |
| 8-Hour Monitoring | ✅ | ❌ | 👁️ | ✅ | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| LOS Monitoring | ✅ | ❌ | 👁️ | ✅ | ✅ | 👁️ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| Escalations | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| Investigation Cases | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ✅ | 🔐 | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| **Financial & Settlement** |
| Payment Advice | ✅ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | 👁️ |
| Payment Processing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 🔐 | ❌ | ❌ | 👁️ | 👁️ | ❌ | 👁️ | ✅ | 👁️ | 👁️ |
| Settlement Console | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ | ❌ | 👁️ | ✅ | 👁️ | 👁️ |
| Bank Account Verify | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ | ❌ | 👁️ | ✅ | ❌ | ❌ |
| **Master Data** |
| Hospital Management | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| Member Management | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Policy Management | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| Product Management | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| **Documents & Communication** |
| Document Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Reminders | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | 👁️ | ❌ |
| Checklists | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Questionnaires | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| **Reporting & Analytics** |
| Hospital Reports | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Common Reports | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | 👁️ | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Management Reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ✅ | 👁️ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financial Reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit Trails | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |

---

## SUMMARY

**Total Roles Defined:** 21 roles across 5 functional categories

**Implementation Priority:**
1. **Phase 1 (Essential):** Super Admin, Claims Handler, Assessor, Medical Officer, Settlement Officer
2. **Phase 2 (Operational):** Submission Team, Senior Handler, Supervisor, Finance Manager, IX Officer
3. **Phase 3 (Management):** Senior MO, IX Manager, Compliance, Escalation Manager, Operations Director
4. **Phase 4 (Analytics):** Report Viewer, Audit Team, External Auditor

**Key Security Principles:**
- Segregation of duties enforced (no user can both process and approve same transaction)
- Temporary roles expire automatically (External Auditor max 90 days)
- All high-level actions are fully audited
- Finance roles cannot approve claims; only process approved payments

---

**Document Owner:** Operations Director  
**Review Frequency:** Quarterly or as needed for regulatory changes  
**Next Review Date:** June 23, 2026

---

**END OF DOCUMENT**
