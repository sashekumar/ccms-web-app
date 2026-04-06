import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Address Form Page Object
 * Represents the inline address form in the Addresses tab of hospital-view.
 * Actual fields:
 *   - address_type (dropdown, required)
 *   - is_primary (checkbox)
 *   - street_line1 (required)
 *   - street_line2
 *   - postal_code
 *   - city
 *   - state
 *   - country
 */
export class HospitalAddressFormPage extends BasePage {
  readonly formHeading: Locator;
  readonly addressTypeDropdown: Locator;
  readonly isPrimaryCheckbox: Locator;
  readonly streetLine1Input: Locator;
  readonly streetLine2Input: Locator;
  readonly postalCodeInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly countryInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.formHeading = page.locator('h4').filter({ hasText: /add new address|edit address/i });
    this.addressTypeDropdown = page.locator('[name="address_type"]');
    this.isPrimaryCheckbox = page.getByRole('checkbox', { name: /primary/i });
    this.streetLine1Input = page.locator('input[name="address_line1"]');
    this.streetLine2Input = page.locator('input[name="address_line2"]');
    this.postalCodeInput = page.locator('input[name="postal_code"]');
    this.cityInput = page.locator('input[name="city"]');
    this.stateInput = page.locator('input[name="state"]');
    this.countryInput = page.locator('input[name="country"]');
    this.saveButton = page.getByRole('button', { name: /save address|update address/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForFormVisible(): Promise<void> {
    await expect(this.formHeading).toBeVisible({ timeout: 10000 });
  }

  async fillAddressForm(data: {
    addressType?: string;
    isPrimary?: boolean;
    streetLine1?: string;
    streetLine2?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  }): Promise<void> {
    if (data.addressType !== undefined) {
      await this.addressTypeDropdown.click();
      await this.page.getByRole('option', { name: data.addressType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.streetLine1 !== undefined) {
      await this.streetLine1Input.clear();
      await this.streetLine1Input.fill(data.streetLine1);
    }

    if (data.streetLine2 !== undefined) {
      await this.streetLine2Input.clear();
      await this.streetLine2Input.fill(data.streetLine2);
    }

    if (data.postalCode !== undefined) {
      await this.postalCodeInput.clear();
      await this.postalCodeInput.fill(data.postalCode);
    }

    if (data.city !== undefined) {
      await this.cityInput.clear();
      await this.cityInput.fill(data.city);
    }

    if (data.state !== undefined) {
      await this.stateInput.clear();
      await this.stateInput.fill(data.state);
    }

    if (data.country !== undefined) {
      await this.countryInput.clear();
      await this.countryInput.fill(data.country);
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
    await this.page.waitForTimeout(1200);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getStreetLine1(): Promise<string> {
    return await this.streetLine1Input.inputValue();
  }
}
