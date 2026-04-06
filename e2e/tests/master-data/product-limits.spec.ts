import { test, expect } from '../../fixtures/auth.fixture';
import { ProductListPage } from '../../page-objects/master-data/product-list.page';
import { ProductFormPage } from '../../page-objects/master-data/product-form.page';
import { ProductViewPage } from '../../page-objects/master-data/product-view.page';
import { ProductLimitFormPage } from '../../page-objects/master-data/product-limit-form.page';

/**
 * Product Limits - Sub-form CRUD Operations E2E Tests
 * 
 * Tests product coverage limit management including:
 * - Creating coverage limits for a product
 * - Updating limit amounts
 * - Deleting limits
 * - Limit type categorization (Annual, Lifetime, Per Visit, etc.)
 * - Period-based limit tracking
 */

test.describe.serial('Product Limits - CRUD Operations', () => {
  const timestamp = Date.now();
  const testPlanCode = `PLIM${timestamp}`;
  const testPlanName = `E2E Product Limits ${timestamp}`;

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

  test('VALIDATION: should validate required limit fields', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    const isDisabled = await limitFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('CREATE: should add annual limit to product', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    await limitFormPage.fillLimitForm({
      limitType: 'Annual Limit',
      limitAmount: '100000.00',
      isActive: true
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectLimitVisible('ANNUAL');
  });

  test('CREATE: should add a second limit for testing', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    await limitFormPage.fillLimitForm({
      limitType: 'Outpatient Limit',
      limitAmount: '5000.00',
      isActive: true
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectLimitVisible('OUTPATIENT');
  });

  test('READ: should display limit details correctly', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.expectLimitVisible('ANNUAL');
    await productViewPage.expectLimitVisible('OUTPATIENT');
  });

  test('UPDATE: should update limit amount', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.editLimit('ANNUAL');
    await limitFormPage.waitForPageLoad();

    await limitFormPage.fillLimitForm({
      limitAmount: '150000.00'
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectLimitVisible('ANNUAL');
  });

  test('DELETE: should delete limit successfully', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    const row = authenticatedPage.locator(`tr:has-text("OUTPATIENT")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    await productViewPage.deleteLimit('OUTPATIENT');

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
