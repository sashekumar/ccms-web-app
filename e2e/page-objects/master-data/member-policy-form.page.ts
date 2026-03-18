import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member Policy Form Page Object
 * Represents the member policy assignment create/edit modal/form for e2e testing
 */
export class MemberPolicyFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly productSelect: Locator;
  readonly policyNumberInput: Locator;
  readonly effectiveDateInput: Locator;
  readonly expiryDateInput: Locator;
  readonly policyStatusSelect: Locator;
  readonly premiumAmountInput: Locator;
  readonly coverageAmountInput: Locator;
  readonly remarksInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /policy/i });
    this.productSelect = page.getByLabel(/product|plan/i);
    this.policyNumberInput = page.getByLabel(/policy number|policy no/i);
    this.effectiveDateInput = page.getByLabel(/effective date|start date/i);
    this.expiryDateInput = page.getByLabel(/expiry date|end date/i);
    this.policyStatusSelect = page.getByLabel(/policy status|status/i);
    this.premiumAmountInput = page.getByLabel(/premium.*amount|premium/i);
    this.coverageAmountInput = page.getByLabel(/coverage.*amount|sum.*insured/i);
    this.remarksInput = page.getByLabel(/remarks|notes/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillPolicyForm(data: {
    product?: string;
    policyNumber?: string;
    effectiveDate?: string;
    expiryDate?: string;
    policyStatus?: string;
    premiumAmount?: string;
    coverageAmount?: string;
    remarks?: string;
  }): Promise<void> {
    if (data.product !== undefined) {
      await this.productSelect.selectOption(data.product);
    }
    
    if (data.policyNumber !== undefined) {
      await this.policyNumberInput.fill(data.policyNumber);
    }
    
    if (data.effectiveDate !== undefined) {
      await this.effectiveDateInput.fill(data.effectiveDate);
    }
    
    if (data.expiryDate !== undefined) {
      await this.expiryDateInput.fill(data.expiryDate);
    }
    
    if (data.policyStatus !== undefined) {
      await this.policyStatusSelect.selectOption(data.policyStatus);
    }
    
    if (data.premiumAmount !== undefined) {
      await this.premiumAmountInput.fill(data.premiumAmount);
    }
    
    if (data.coverageAmount !== undefined) {
      await this.coverageAmountInput.fill(data.coverageAmount);
    }
    
    if (data.remarks !== undefined) {
      await this.remarksInput.fill(data.remarks);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getPolicyNumber(): Promise<string> {
    return await this.policyNumberInput.inputValue();
  }

  async getEffectiveDate(): Promise<string> {
    return await this.effectiveDateInput.inputValue();
  }

  async getPremiumAmount(): Promise<string> {
    return await this.premiumAmountInput.inputValue();
  }
}
