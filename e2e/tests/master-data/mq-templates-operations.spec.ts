import { test, expect } from '../../fixtures/auth.fixture';
import { MqTemplateListPage } from '../../page-objects/master-data/mq-template-list.page';
import { MqTemplateFormPage } from '../../page-objects/master-data/mq-template-form.page';

/**
 * MQ Template Management - CRUD Operations E2E Tests
 * 
 * Tests MQ template management including:
 * - Creating templates
 * - Updating template details
 * - Deleting templates
 * - Managing questions within templates
 * - Validation and search functionality
 * 
 * Following coding-standards.md principles:
 * - Page Object Model for maintainability
 * - Proper test data management with timestamps
 * - Comprehensive validation testing
 * - Serial execution to ensure data persistence
 */

test.describe.serial('MQ Template Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testTemplateCode = `E2E_MQT_${timestamp}`;
  const testCategory = 'E2E Test Category';
  const updatedCategory = `E2E Updated ${timestamp}`;
  const testQuestionText = `What is the patient's current condition? [E2E ${timestamp}]`;
  const updatedQuestionText = `What is the patient's updated condition? [E2E ${timestamp}]`;

  test('CREATE: should create a new MQ template successfully', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);
    const mqTemplateFormPage = new MqTemplateFormPage(authenticatedPage);

    // Navigate to MQ templates page
    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    // Click create button
    await mqTemplateListPage.clickCreateTemplate();
    await mqTemplateFormPage.waitForPageLoad();

    // Fill in template details
    await mqTemplateFormPage.fillTemplateForm({
      templateCode: testTemplateCode,
      recipientType: 'Hospital',
      category: testCategory,
      emailSubject: 'Medical Clarification Request',
      reminderDays: 7,
      autoReminderDays: 14,
      isActive: true
    });

    // Submit form
    await mqTemplateFormPage.submit();
    await mqTemplateListPage.waitForPageLoad();

    // Search for the created template
    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify template is visible
    await mqTemplateListPage.expectTemplateVisible(testTemplateCode);
  });

  test('VALIDATION: should validate required fields on template creation', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);
    const mqTemplateFormPage = new MqTemplateFormPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.clickCreateTemplate();
    await mqTemplateFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    await mqTemplateFormPage.submit();
    await authenticatedPage.waitForTimeout(500);

    // Modal should still be visible (form validation prevents submission)
    await expect(mqTemplateFormPage.modalTitle).toBeVisible();
  });

  test('CREATE: should add questions to template', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);
    const mqTemplateFormPage = new MqTemplateFormPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    // Search and select the created template
    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);
    await mqTemplateListPage.clickRow(testTemplateCode);

    // Verify questions panel appears
    await mqTemplateListPage.expectQuestionsPanelVisible();

    // Add a question
    await mqTemplateListPage.clickAddQuestion();
    await mqTemplateFormPage.waitForPageLoad();

    await mqTemplateFormPage.fillQuestionForm({
      questionText: testQuestionText,
      requiredLines: 3,
      sortOrder: 1
    });

    await mqTemplateFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify question appears in the panel
    await expect(authenticatedPage.locator('.group').filter({ hasText: testQuestionText })).toBeVisible({ timeout: 10000 });
  });

  test('READ: should display template details correctly', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    const row = mqTemplateListPage.getRow(testTemplateCode);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(testCategory);
  });

  test('SEARCH: should filter templates by search term', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    // Search with a unique term
    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    // Should show the matching template
    await mqTemplateListPage.expectTemplateVisible(testTemplateCode);

    // Clear search
    await mqTemplateListPage.search('');
    await authenticatedPage.waitForTimeout(500);
  });

  test('UPDATE: should update template details successfully', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);
    const mqTemplateFormPage = new MqTemplateFormPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    // Click edit button
    await mqTemplateListPage.clickEdit(testTemplateCode);
    await mqTemplateFormPage.waitForPageLoad();

    // Update template details
    await mqTemplateFormPage.fillTemplateForm({
      category: updatedCategory,
      emailSubject: 'Updated Subject',
      reminderDays: 10
    });

    await mqTemplateFormPage.submit();
    await mqTemplateListPage.waitForPageLoad();

    // Verify updated details
    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    const row = mqTemplateListPage.getRow(testTemplateCode);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText(updatedCategory);
  });

  test('UPDATE: should edit question successfully', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);
    const mqTemplateFormPage = new MqTemplateFormPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);
    await mqTemplateListPage.clickRow(testTemplateCode);

    // Edit the question
    await mqTemplateListPage.clickEditQuestion(testQuestionText);
    await mqTemplateFormPage.waitForPageLoad();

    await mqTemplateFormPage.fillQuestionForm({
      questionText: updatedQuestionText,
      requiredLines: 5
    });

    await mqTemplateFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated question appears
    await expect(authenticatedPage.locator('.group').filter({ hasText: updatedQuestionText })).toBeVisible({ timeout: 10000 });
  });

  test('DELETE: should delete question successfully', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);
    await mqTemplateListPage.clickRow(testTemplateCode);

    // Get initial question count
    const initialCount = await mqTemplateListPage.getQuestionCount();

    // Delete the question
    await mqTemplateListPage.clickDeleteQuestion(updatedQuestionText);
    await mqTemplateListPage.confirmDialog();
    await authenticatedPage.waitForTimeout(1000);

    // Verify question count decreased
    const newCount = await mqTemplateListPage.getQuestionCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('DELETE: should delete template successfully', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);

    // Click delete button
    await mqTemplateListPage.clickDelete(testTemplateCode);
    await mqTemplateListPage.confirmDialog();
    await authenticatedPage.waitForTimeout(1000);

    // Verify template is removed
    await mqTemplateListPage.search(testTemplateCode);
    await authenticatedPage.waitForTimeout(500);
    await mqTemplateListPage.expectTemplateNotVisible(testTemplateCode);
  });

  test('should display MQ templates page with proper permissions', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    // Verify page elements are visible
    await expect(mqTemplateListPage.pageTitle).toBeVisible();
    await expect(mqTemplateListPage.createButton).toBeVisible();
    await expect(mqTemplateListPage.dataTable).toBeVisible();
  });

  test('should handle empty search results', async ({ authenticatedPage }) => {
    const mqTemplateListPage = new MqTemplateListPage(authenticatedPage);

    await mqTemplateListPage.goto();
    await mqTemplateListPage.waitForPageLoad();

    // Search for non-existent template
    await mqTemplateListPage.search(`NONEXISTENT_${timestamp}`);
    await authenticatedPage.waitForTimeout(500);

    // Should show no results message or empty table
    const hasNoDataMessage = await mqTemplateListPage.noDataMessage.isVisible().catch(() => false);
    const rowCount = await authenticatedPage.locator('tbody tr').count();
    
    expect(hasNoDataMessage || rowCount === 0).toBeTruthy();
  });
});
