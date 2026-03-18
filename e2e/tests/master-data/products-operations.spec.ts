import { test, expect } from '../../fixtures/auth.fixture';
import { ProductListPage } from '../../page-objects/master-data/product-list.page';
import { ProductFormPage } from '../../page-objects/master-data/product-form.page';

/**
 * Product Management - CRUD Operations E2E Tests
 * 
 * Tests product/policy management including:
 * - Creating products
 * - Updating product details
 * - Deleting products
 * - Validation and search functionality
 */

test.describe.serial('Product Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testPlanCode = `E2E_PLAN_${timestamp}`;
  const testPlanName = `E2E Test Plan ${timestamp}`;
  const testInsurer = `E2E Test Insurer ${timestamp}`;
  const updatedPlanName = `E2E Updated Plan ${timestamp}`;

  test('CREATE: should create a new product successfully', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.clickCreateProduct();
    await productFormPage.waitForPageLoad();

    await productFormPage.fillProductForm({
      planCode: testPlanCode,
      planName: testPlanName,
      insurerName: testInsurer,
      isActive: true
    });

    await productFormPage.submit();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.expectProductVisible(testPlanCode);
    await productListPage.expectProductVisible(testPlanName);
  });

  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.clickCreateProduct();
    await productFormPage.waitForPageLoad();

    const isDisabled = await productFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display product details correctly', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.expectProductVisible(testPlanCode);
    await productListPage.expectProductVisible(testPlanName);
  });

  test('UPDATE: should update product details successfully', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.clickEdit(testPlanCode);
    await productFormPage.waitForPageLoad();

    const currentCode = await productFormPage.getPlanCode();
    const currentName = await productFormPage.getPlanName();
    expect(currentCode).toBe(testPlanCode);
    expect(currentName).toBe(testPlanName);

    await productFormPage.fillProductForm({
      planName: updatedPlanName
    });

    await productFormPage.submit();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.expectProductVisible(updatedPlanName);
  });

  test('DELETE: should delete product successfully', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${testPlanCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    await authenticatedPage.waitForTimeout(1000);

    await productListPage.expectProductNotVisible(testPlanCode);
  });
});
