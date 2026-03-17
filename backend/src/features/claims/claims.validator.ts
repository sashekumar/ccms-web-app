import Joi from 'joi';

export const updateClaimSchema = Joi.object({
  claim_status: Joi.string().max(50).optional(),
  total_billed: Joi.number().min(0).optional(),
  total_approved: Joi.number().min(0).optional(),
  
  rejection_type: Joi.string().max(50).optional(),
  rejection_reason: Joi.string().max(4000).optional(),
  approval_authority: Joi.string().max(50).optional(),
  
  payee_name: Joi.string().max(255).optional(),
  payee_ic_no: Joi.string().max(20).optional(),
  payee_bank_name: Joi.string().max(100).optional(),
  payee_bank_account_no: Joi.string().max(50).optional(),
  
  document_received_at: Joi.date().iso().optional()
});
