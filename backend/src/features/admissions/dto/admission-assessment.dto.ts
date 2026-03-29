/**
 * Admission Assessment DTOs
 *
 * Maps to ccms_admission_assessments (EAV pattern).
 * Each row stores one field_name / field_value pair per admission.
 *
 * Predefined field names (enforced by frontend):
 *   DIAGNOSIS_CODE          – ICD / diagnosis code
 *   DIAGNOSIS_DESCRIPTION   – Free-text description
 *   MEDICAL_NECESSITY       – Justification narrative
 *   ATTENDING_PHYSICIAN     – Doctor's name
 *   COMPLICATIONS           – Comorbidities / complications
 *   TREATMENT_PLAN          – Planned treatment
 *   PROGNOSIS               – GOOD | FAIR | POOR | CRITICAL
 *   CLINICAL_NOTES          – Additional notes
 */

export interface AdmissionAssessment {
  assessment_id: number;
  admission_id: number;
  field_name: string;
  field_value: string | null;
  created_at: Date | string;
  created_by: string | null;
  updated_at: Date | string | null;
  updated_by: string | null;
}

export interface AssessmentFieldDto {
  field_name: string;    // Must be one of the predefined constants
  field_value: string | null;
}

export interface UpsertAdmissionAssessmentsDto {
  admission_id: number;
  fields: AssessmentFieldDto[];
}
