import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestigationResponse, UpdateInvestigationDto, CreateInvestigationRequestDto, CreateInvestigationCallLogDto } from '../../../../shared/models/investigation.model';

/**
 * Investigation Action Modal Component
 * 
 * Reusable modal for managing investigation actions:
 * - Update status and findings
 * - Add document/info requests
 * - Log investigation calls
 * 
 * Features:
 * - Encapsulated form logic
 * - Type-safe action handling
 * - Reusable across modules
 * - Clear separation of concerns
 */
export type ActionType = 'UPDATE_STATUS' | 'ADD_REQUEST' | 'ADD_CALL';

export interface ActionModalData {
  newStatus?: string;
  findings?: string;
  type?: string;
  requestedFrom?: string;
  expectedDate?: string;
  description?: string;
  callDate?: string;
  calledParty?: string;
  callDuration?: number;
  notes?: string;
}

@Component({
  selector: 'app-investigation-action-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="show" (click)="cancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3>{{ getModalTitle() }}</h3>
          <button (click)="cancel()" class="close-btn">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Update Status Form -->
          <form *ngIf="actionType === 'UPDATE_STATUS'" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>New Status</label>
              <select [(ngModel)]="data.newStatus" name="newStatus" required class="form-control">
                <option [value]="">Select Status</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div class="form-group">
              <label>Findings</label>
              <textarea [(ngModel)]="data.findings" name="findings" class="form-control" rows="3" placeholder="Enter investigation findings"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Updating...' : 'Update Status' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
            </div>
          </form>

          <!-- Add Request Form -->
          <form *ngIf="actionType === 'ADD_REQUEST'" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Request Type</label>
              <select [(ngModel)]="data.type" name="type" required class="form-control">
                <option [value]="">Select Type</option>
                <option value="MEDICAL_RECORDS">Medical Records</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="INVESTIGATION_REPORT">Investigation Report</option>
                <option value="SUPPORTING_DOCUMENTS">Supporting Documents</option>
                <option value="CONSULTATION_NOTES">Consultation Notes</option>
                <option value="FINANCIAL_DOCUMENTS">Financial Documents</option>
              </select>
            </div>

            <div class="form-group">
              <label>Requested From</label>
              <input [(ngModel)]="data.requestedFrom" name="requestedFrom" type="text" class="form-control" required placeholder="Hospital/Organization name">
            </div>

            <div class="form-group">
              <label>Expected Date</label>
              <input [(ngModel)]="data.expectedDate" name="expectedDate" type="date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="data.description" name="description" class="form-control" rows="3" placeholder="Additional details about the request"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Adding...' : 'Add Request' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
            </div>
          </form>

          <!-- Add Call Log Form -->
          <form *ngIf="actionType === 'ADD_CALL'" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Call Date</label>
              <input [(ngModel)]="data.callDate" name="callDate" type="date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Called Party</label>
              <input [(ngModel)]="data.calledParty" name="calledParty" type="text" class="form-control" required placeholder="Person/Organization contacted">
            </div>

            <div class="form-group">
              <label>Call Duration (minutes)</label>
              <input [(ngModel)]="data.callDuration" name="callDuration" type="number" class="form-control" min="0" placeholder="0">
            </div>

            <div class="form-group">
              <label>Call Notes</label>
              <textarea [(ngModel)]="data.notes" name="notes" class="form-control" rows="3" placeholder="Summary of call discussion"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Logging...' : 'Log Call' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #1f2937;
    }

    .modal-body {
      padding: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #374151;
    }

    .btn-secondary:hover {
      background-color: #d1d5db;
    }
  `]
})
export class InvestigationActionModalComponent implements OnInit {
  @Input() show = false;
  @Input() actionType: ActionType | null = null;
  @Input() investigation: InvestigationResponse | null = null;
  @Input() loading = false;
  @Output() submit = new EventEmitter<ActionModalData>();
  @Output() close = new EventEmitter<void>();

  data: ActionModalData = {};

  ngOnInit(): void {
    this.resetData();
  }

  /**
   * Get modal title based on action type
   */
  getModalTitle(): string {
    switch (this.actionType) {
      case 'UPDATE_STATUS':
        return 'Update Investigation Status';
      case 'ADD_REQUEST':
        return 'Add Document Request';
      case 'ADD_CALL':
        return 'Log Investigation Call';
      default:
        return 'Investigation Action';
    }
  }

  /**
   * Submit form action
   * Validates required fields before emitting
   */
  onSubmit(): void {
    // Validate required fields based on action type
    if (this.actionType === 'UPDATE_STATUS' && !this.data.newStatus) {
      return; // Form validation will handle
    }

    if (this.actionType === 'ADD_REQUEST' && (!this.data.type || !this.data.requestedFrom)) {
      return; // Form validation will handle
    }

    this.submit.emit(this.data);
  }

  /**
   * Cancel modal
   * Resets form and emits close event
   */
  cancel(): void {
    this.resetData();
    this.close.emit();
  }

  /**
   * Reset form data to defaults
   */
  private resetData(): void {
    this.data = {
      newStatus: '',
      findings: '',
      type: '',
      requestedFrom: '',
      expectedDate: '',
      description: '',
      callDate: new Date().toISOString().split('T')[0],
      calledParty: '',
      callDuration: 0,
      notes: ''
    };
  }
}
