import { test, expect } from '../../fixtures/auth.fixture';
import { ProductListPage } from '../../page-objects/master-data/product-list.page';
import { ProductFormPage } from '../../page-objects/master-data/product-form.page';
import { ProductViewPage } from '../../page-objects/master-data/product-view.page';
import { ProductThresholdFormPage } from '../../page-objects/master-data/product-threshold-form.page';

/**
 * Product LOS Alert Thresholds - Sub-form CRUD Operations E2E Tests
 * 
 * Tests product LOS (Length of Stay) alert threshold management including:
 * - Creating alert thresholds for a product
 * - Updating threshold days and alert levels
 * - Deleting thresholds
 * - Threshold category assignment
 * - Alert level categorization (Warning, Critical, Extremely Critical)
 */

test.describe.serial('Product LOS Alert Thresholds - CRUD Operations', () => {
  const timestamp = Date.now();
  const testPlanCode = `PLOS${timestamp}`;
  const testPlanName = `E2E Product LOS ${timestamp}`;

  let productId: string;

  test('SETUP: Create a test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.clickCreateProduct();
    await productFormPage.waitForPageLoad();

    await productFormPage.fillProductForm({
      planCode: testPlanCode,
      planName: testPlanName,
      isActive: true
    });

    await productFormPage.submit();
    await productListPage.waitForPageLoad();

    // Navigate to view to get product ID
    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(600);
    await productListPage.clickView(testPlanCode);
    await authenticatedPage.waitForURL(/\/products\/view\/\d+/, { timeout: 15000 });

    const url = authenticatedPage.url();
    const match = url.match(/\/products\/view\/(\d+)/);
    productId = match ? match[1] : '';
    expect(productId).toBeTruthy();
  });

  test('VALIDATION: should initialize threshold form with default values', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const thresholdFormPage = new ProductThresholdFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    await productViewPage.clickAddThreshold();
    await thresholdFormPage.waitForPageLoad();

    // Form should have default values: threshold_days=1, alert_level=1, is_active=true
    const thresholdDays = await thresholdFormPage.getThresholdDays();
    expect(thresholdDays).toContain('1');

    // Submit should be enabled since form has valid defaults
    const isDisabled = await thresholdFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(false);

    // Cancel without submitting
    await thresholdFormPage.cancel();
  });

  test('CREATE: should add warning level threshold for infectious diseases', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const thresholdFormPage = new ProductThresholdFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    await productViewPage.clickAddThreshold();
    await thresholdFormPage.waitForPageLoad();

    await thresholdFormPage.fillThresholdForm({
      diagnosisCategory: 'Infectious and Parasitic Diseases',
      thresholdDays: '7',
      alertLevel: 'Level 1 - Warning',
      isActive: true
    });

    await thresholdFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectThresholdVisible('INFECTIOUS');
  });

  test('CREATE: should add critical level threshold for circulatory diseases', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const thresholdFormPage = new ProductThresholdFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    await productViewPage.clickAddThreshold();
    await thresholdFormPage.waitForPageLoad();

    await thresholdFormPage.fillThresholdForm({
      diagnosisCategory: 'Diseases of the Circulatory System',
      thresholdDays: '14',
      alertLevel: 'Level 2 - Critical',
      isActive: true
    });

    await thresholdFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectThresholdVisible('CIRCULATORY');
  });

  test('READ: should display threshold details correctly', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    await productViewPage.expectThresholdVisible('INFECTIOUS');
    await productViewPage.expectThresholdVisible('CIRCULATORY');
  });

  test('UPDATE: should update threshold days', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const thresholdFormPage = new ProductThresholdFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    await productViewPage.editThreshold('INFECTIOUS');
    await thresholdFormPage.waitForPageLoad();

    await thresholdFormPage.fillThresholdForm({
      thresholdDays: '10'
    });

    await thresholdFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectThresholdVisible('INFECTIOUS');
  });

  test('DELETE: should delete threshold successfully', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickThresholdsTab();

    const row = authenticatedPage.locator(`tr:has-text("CIRCULATORY")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    await productViewPage.deleteThreshold('CIRCULATORY');

    // Confirm the Angular ConfirmDialogComponent modal
    await authenticatedPage.locator('app-confirm-dialog').getByRole('button', { name: 'Delete' }).click();
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('CLEANUP: Delete test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.clickDelete(testPlanCode);
    await authenticatedPage.locator('app-confirm-dialog').getByRole('button', { name: 'Delete' }).click();
    await authenticatedPage.waitForLoadState('networkidle');
    // Backend uses soft-delete (deactivation) - product still visible but deactivated
  });
});
