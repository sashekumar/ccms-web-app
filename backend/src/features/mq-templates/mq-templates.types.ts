/**
 * Type definitions for MQ Templates module
 */

// ─── Template ────────────────────────────────────────────────────────────────

export interface MqTemplate {
  template_id: number;
  template_code: string;
  template_category: string;
  recipient_type: 'HOSP' | 'PH'; // Hospital or Policy Holder
  mode: string | null;
  header_message: string | null;
  footer_message: string | null;
  email_subject: string | null;
  reminder_days: number | null;
  auto_reminder_days: number | null;
  status: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface MqTemplateListItem {
  template_id: number;
  template_code: string;
  template_category: string;
  recipient_type: string;
  mode: string | null;
  email_subject: string | null;
  reminder_days: number | null;
  auto_reminder_days: number | null;
  question_count: number;
  is_active: boolean;
}

export interface CreateMqTemplateDto {
  template_code: string;
  template_category: string;
  recipient_type: 'HOSP' | 'PH';
  mode?: string;
  header_message?: string;
  footer_message?: string;
  email_subject?: string;
  reminder_days?: number;
  auto_reminder_days?: number;
  is_active?: boolean;
}

export interface UpdateMqTemplateDto {
  template_code?: string;
  template_category?: string;
  recipient_type?: 'HOSP' | 'PH';
  mode?: string;
  header_message?: string;
  footer_message?: string;
  email_subject?: string;
  reminder_days?: number;
  auto_reminder_days?: number;
  is_active?: boolean;
}

export interface MqTemplateFilters {
  search?: string;
  recipient_type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedMqTemplates {
  templates: MqTemplateListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface MqTemplateQuestion {
  question_id: number;
  template_id: number;
  question_text: string;
  required_lines: number;
  sort_order: number;
  status: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface CreateMqQuestionDto {
  template_id: number;
  question_text: string;
  required_lines?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateMqQuestionDto {
  question_text?: string;
  required_lines?: number;
  sort_order?: number;
  is_active?: boolean;
}

// ─── Combined (for MQ builder) ────────────────────────────────────────────────

export interface MqTemplateWithQuestions extends MqTemplate {
  questions: MqTemplateQuestion[];
}
