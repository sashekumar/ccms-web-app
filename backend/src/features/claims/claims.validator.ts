import Joi from 'joi';

export const createClaimSchema = Joi.object({
  member_id: Joi.number().integer().required(),
  hospital_id: Joi.number().integer().required(),
  policy_record_id: Joi.number().integer().optional().allow(null),
  patient_type: Joi.string().max(20).optional().allow(null, ''),
  patient_id: Joi.number().integer().optional().allow(null),
  disability_category: Joi.string().max(100).optional().allow(null, ''),
  total_billed: Joi.number().min(0).optional().default(0),
  document_received_at: Joi.date().iso().optional().allow(null),
  payee_name: Joi.string().max(255).optional().allow(null, ''),
  payee_ic_no: Joi.string().max(20).optional().allow(null, ''),
  payee_bank_name: Joi.string().max(100).optional().allow(null, ''),
  payee_bank_account_no: Joi.string().max(50).optional().allow(null, ''),
  claim_mode: Joi.string().max(20).optional().allow(null, '')
});

export const updateClaimSchema = Joi.object({
  claim_status: Joi.string().max(50).optional().allow(null, ''),
  member_id: Joi.number().integer().optional().allow(null),
  hospital_id: Joi.number().integer().optional().allow(null),
  patient_type: Joi.string().max(20).optional().allow(null, ''),
  patient_id: Joi.number().integer().optional().allow(null),
  disability_category: Joi.string().max(100).optional().allow(null, ''),
  total_billed: Joi.number().min(0).optional().allow(null),
  total_approved: Joi.number().min(0).optional().allow(null),
  
  rejection_type: Joi.string().max(50).optional().allow(null, ''),
  rejection_reason: Joi.string().max(4000).optional().allow(null, ''),
  approval_authority: Joi.string().max(50).optional().allow(null, ''),
  
  payee_name: Joi.string().max(255).optional().allow(null, ''),
  payee_ic_no: Joi.string().max(20).optional().allow(null, ''),
  payee_bank_name: Joi.string().max(100).optional().allow(null, ''),
  payee_bank_account_no: Joi.string().max(50).optional().allow(null, ''),
  
  document_received_at: Joi.date().iso().optional().allow(null),
  
  is_ec_case: Joi.boolean().optional().allow(null),
  ec_status: Joi.string().max(50).optional().allow(null, ''),
  ec_notification_date: Joi.date().iso().optional().allow(null),
  ec_closed_date: Joi.date().iso().optional().allow(null),

  // Allow nested arrays if they are passed in but handled separately
  expenses: Joi.array().optional().allow(null),
  documents: Joi.array().optional().allow(null),
  patient_id_copy: Joi.any().optional(), // In case some internal keys leak
  claim_mode: Joi.string().max(20).optional().allow(null, '')
});
