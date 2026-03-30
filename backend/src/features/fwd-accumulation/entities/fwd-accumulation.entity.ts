/**
 * FWD Accumulation Entities - Maps to v7 FWD accumulation tables
 * 4 tables consolidating legacy dt_FWD_Accumulation_* tables
 *
 * created_by / updated_by are VARCHAR(50)
 * accumulated_amount uses MONEY type
 */

/** Maps to ccms_fwd_accumulation_client */
export interface FwdAccumulationClientEntity {
  client_acc_id: number;                  // PK
  legacy_fwd_client_acc_id?: string;      // UNIQUEIDENTIFIER
  member_id: number;                      // FK → ccms_members
  fwd_client_no?: string;                 // VARCHAR(50)
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;            // MONEY
  as_at_date?: Date;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/** Maps to ccms_fwd_accumulation_disability */
export interface FwdAccumulationDisabilityEntity {
  disability_acc_id: number;              // PK
  legacy_fwd_disability_acc_id?: string;  // UNIQUEIDENTIFIER
  disability_code?: string;               // VARCHAR(50)
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;            // MONEY
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/** Maps to ccms_fwd_accumulation_onetime */
export interface FwdAccumulationOnetimeEntity {
  onetime_acc_id: number;                 // PK
  legacy_fwd_onetime_acc_id?: string;     // UNIQUEIDENTIFIER
  member_id: number;                      // FK → ccms_members
  fwd_member_no?: string;                 // VARCHAR(50)
  benefit_code?: string;                  // VARCHAR(50)
  accumulated_amount?: number;            // MONEY
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/** Maps to ccms_fwd_accumulation_pa */
export interface FwdAccumulationPaEntity {
  pa_acc_id: number;                      // PK
  legacy_fwd_pa_acc_id?: string;          // UNIQUEIDENTIFIER
  pa_id: number;                          // FK → ccms_payment_advice
  claim_id: number;                       // FK → ccms_claims
  accumulated_amount?: number;            // MONEY
  as_at_date?: Date;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
