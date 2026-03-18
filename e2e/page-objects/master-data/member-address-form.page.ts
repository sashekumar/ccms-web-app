import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member Address Form Page Object
 * Represents the member address create/edit modal/form for e2e testing
 */
export class MemberAddressFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly addressTypeSelect: Locator;
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly postcodeInput: Locator;
  readonly countrySelect: Locator;
  readonly isPrimaryCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /address/i });
    this.addressTypeSelect = page.getByLabel(/address type|type/i);
    this.addressLine1Input = page.getByLabel(/address line 1|address 1/i);
    this.addressLine2Input = page.getByLabel(/address line 2|address 2/i);
    this.cityInput = page.getByLabel(/city/i);
    this.stateSelect = page.getByLabel(/state/i);
    this.postcodeInput = page.getByLabel(/postcode|postal code|zip/i);
    this.countrySelect = page.getByLabel(/country/i);
    this.isPrimaryCheckbox = page.getByLabel(/primary|is primary/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillAddressForm(data: {
    addressType?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    isPrimary?: boolean;
  }): Promise<void> {
    if (data.addressType !== undefined) {
      await this.addressTypeSelect.selectOption(data.addressType);
    }
    
    if (data.addressLine1 !== undefined) {
      await this.addressLine1Input.fill(data.addressLine1);
    }
    
    if (data.addressLine2 !== undefined) {
      await this.addressLine2Input.fill(data.addressLine2);
    }
    
    if (data.city !== undefined) {
      await this.cityInput.fill(data.city);
    }
    
    if (data.state !== undefined) {
      await this.stateSelect.selectOption(data.state);
    }
    
    if (data.postcode !== undefined) {
      await this.postcodeInput.fill(data.postcode);
    }
    
    if (data.country !== undefined) {
      await this.countrySelect.selectOption(data.country);
    }
    
    if (data.isPrimary !== undefined) {
      const isChecked = await this.isPrimaryCheckbox.isChecked();
      if (data.isPrimary !== isChecked) {
        await this.isPrimaryCheckbox.click();
      }
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

  async getAddressType(): Promise<string> {
    return await this.addressTypeSelect.inputValue();
  }

  async getAddressLine1(): Promise<string> {
    return await this.addressLine1Input.inputValue();
  }

  async getCity(): Promise<string> {
    return await this.cityInput.inputValue();
  }

  async getPostcode(): Promise<string> {
    return await this.postcodeInput.inputValue();
  }
}
