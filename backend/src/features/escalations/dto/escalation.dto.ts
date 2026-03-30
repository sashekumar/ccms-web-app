export interface CreateEscalationDto {
  claim_id: number;
  source_id?: number | null;
  nature_id?: number | null;
  priority: string;
  // assigned_to set by service
}

export interface UpdateEscalationDto {
  assigned_to?: string | null;
  status?: string | null;
  priority?: string | null;
  // Remarks & updates logged separately
}

export interface AddEscalationUpdateDto {
  update_description: string;
  remarks?: string | null;
}

export interface CloseEscalationDto {
  remarks?: string | null;
}
