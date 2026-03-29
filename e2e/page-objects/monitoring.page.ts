import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Monitoring Dashboard Page Object
 * 
 * Encapsulates all interactions with the monitoring dashboard including:
 * - Tab navigation (LOS alerts and 8HM checks)
 * - Multi-level filtering (alert levels, check status)
 * - Search functionality
 * - Expansion panels for detail views
 * - Modal interactions (acknowledge alerts, record checks)
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: All monitoring interactions in one place
 * - MODULARIZATION: Methods organized by feature
 * - COMMONIZATION: Shared element selectors
 */

export class MonitoringPage extends BasePage {
  // Main tabs
  private readonly losAlertsTab = (): Locator => this.page.locator('[data-testid="tab-alerts"]');
  private readonly ehmChecksTab = (): Locator => this.page.locator('[data-testid="tab-checks"]');

  // LOS Alert Level Tabs (Task 13)
  private readonly allAlertsTabBtn = (): Locator => this.page.locator('button:has-text("All Alerts")');
  private readonly level1TabBtn = (): Locator => this.page.locator('button:has-text("Level 1")');
  private readonly level2TabBtn = (): Locator => this.page.locator('button:has-text("Level 2")');
  private readonly level3TabBtn = (): Locator => this.page.locator('button:has-text("Level 3")');

  // 8HM Check Status Tabs (Task 15)
  private readonly allChecksTabBtn = (): Locator => this.page.locator('button:has-text("All Checks"):nth-of-type(1)');
  private readonly stableStatusTabBtn = (): Locator => this.page.locator('button:has-text("Stable")');
  private readonly attentionStatusTabBtn = (): Locator => this.page.locator('button:has-text("Attention")');
  private readonly criticalStatusTabBtn = (): Locator => this.page.locator('button:has-text("Critical")');

  // Search & Filter Controls (Task 16)
  private readonly alertSearchInput = (): Locator => this.page.locator('[placeholder="Enter patient name, hospital, or claim ref..."]').first();
  private readonly alertSearchButton = (): Locator => this.page.locator('button:has-text("Search")').first();
  
  private readonly checkSearchInput = (): Locator => this.page.locator('[placeholder="Enter patient name, hospital, or claim ref..."]').last();
  private readonly checkSearchButton = (): Locator => this.page.locator('button:has-text("Search")').last();

  // Alert Cards & Actions (Task 14 - Expansion Panels)
  private readonly alertCards = (): Locator => this.page.locator('[data-testid^="alert-card-"]');
  private readonly alertCardButton = (alertId: string): Locator => this.page.locator(`[data-testid="alert-expand-${alertId}"]`);
  private readonly acknowledgeAlertButton = (alertId: string): Locator => this.page.locator(`[data-testid="alert-acknowledge-${alertId}"]`);

  // Check Cards & Actions (Task 14 - Expansion Panels)
  private readonly checkCards = (): Locator => this.page.locator('[data-testid^="check-card-"]');
  private readonly checkCardButton = (checkId: string): Locator => this.page.locator(`[data-testid="check-expand-${checkId}"]`);
  private readonly recordCheckButton = (checkId: string): Locator => this.page.locator(`[data-testid="check-record-${checkId}"]`);

  // Modals
  private readonly acknowledgeModal = (): Locator => this.page.locator('[data-testid="modal-acknowledge"]');
  private readonly acknowledgeModalNotes = (): Locator => this.page.locator('[data-testid="input-ack-notes"]');
  private readonly acknowledgeModalConfirm = (): Locator => this.page.locator('[data-testid="btn-ack-confirm"]');
  private readonly acknowledgeModalCancel = (): Locator => this.page.locator('[data-testid="btn-ack-cancel"]');

  private readonly recordCheckModal = (): Locator => this.page.locator('[data-testid="modal-record-check"]');
  private readonly recordCheckStatusStable = (): Locator => this.page.locator('[data-testid="btn-check-status-stable"]');
  private readonly recordCheckStatusAttention = (): Locator => this.page.locator('[data-testid="btn-check-status-attention"]');
  private readonly recordCheckStatusCritical = (): Locator => this.page.locator('[data-testid="btn-check-status-critical"]');
  private readonly recordCheckNotes = (): Locator => this.page.locator('[data-testid="input-check-notes"]');
  private readonly recordCheckConfirm = (): Locator => this.page.locator('[data-testid="btn-check-confirm"]');
  private readonly recordCheckCancel = (): Locator => this.page.locator('[data-testid="btn-check-cancel"]');

  // Pagination
  private readonly alertsNextButton = (): Locator => this.page.locator('[data-testid="btn-alerts-next"]');
  private readonly alertsPrevButton = (): Locator => this.page.locator('[data-testid="btn-alerts-prev"]');
  private readonly checksNextButton = (): Locator => this.page.locator('[data-testid="btn-checks-next"]');
  private readonly checksPrevButton = (): Locator => this.page.locator('[data-testid="btn-checks-prev"]');

  // Loading & Empty States
  private readonly loadingSpinner = (): Locator => this.page.locator('app-loading-spinner');
  private readonly emptyState = (): Locator => this.page.locator('text=No alerts found, No monitoring checks');

  /**
   * Navigate to monitoring dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/monitoring');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded successfully
   */
  async expectOnMonitoringPage(): Promise<void> {
    await expect(this.losAlertsTab()).toBeVisible();
    await expect(this.ehmChecksTab()).toBeVisible();
  }

  // === MAIN TAB NAVIGATION ===

  /**
   * Switch to LOS Alerts tab
   */
  async switchToAlertsTab(): Promise<void> {
    await this.losAlertsTab().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to 8HM Checks tab
   */
  async switchToChecksTab(): Promise<void> {
    await this.ehmChecksTab().click();
    await this.page.waitForLoadState('networkidle');
  }

  // === TASK 13: MULTI-LEVEL LOS ALERT TABS ===

  /**
   * Switch to "All Alerts" sub-tab
   */
  async switchToAllAlertsLevel(): Promise<void> {
    await this.allAlertsTabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to Level 1 alerts sub-tab
   */
  async switchToLevel1Alerts(): Promise<void> {
    await this.level1TabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to Level 2 alerts sub-tab
   */
  async switchToLevel2Alerts(): Promise<void> {
    await this.level2TabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to Level 3 alerts sub-tab
   */
  async switchToLevel3Alerts(): Promise<void> {
    await this.level3TabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get count of displayed alert levels
   */
  async getAlertCardsCount(): Promise<number> {
    return await this.alertCards().count();
  }

  // === TASK 15: MULTI-LEVEL 8HM CHECK TABS ===

  /**
   * Switch to "All Checks" sub-tab
   */
  async switchToAllChecksStatus(): Promise<void> {
    await this.allChecksTabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to "Stable" status sub-tab
   */
  async switchToStableChecks(): Promise<void> {
    await this.stableStatusTabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to "Attention" status sub-tab
   */
  async switchToAttentionChecks(): Promise<void> {
    await this.attentionStatusTabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to "Critical" status sub-tab
   */
  async switchToCriticalChecks(): Promise<void> {
    await this.criticalStatusTabBtn().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get count of displayed check cards
   */
  async getCheckCardsCount(): Promise<number> {
    return await this.checkCards().count();
  }

  // === TASK 16: SEARCH & FILTER ===

  /**
   * Search for alerts by term
   */
  async searchAlerts(searchTerm: string): Promise<void> {
    await this.alertSearchInput().fill(searchTerm);
    await this.alertSearchButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear alert search and reset
   */
  async clearAlertSearch(): Promise<void> {
    await this.alertSearchInput().clear();
    await this.alertSearchButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for checks by term
   */
  async searchChecks(searchTerm: string): Promise<void> {
    await this.checkSearchInput().fill(searchTerm);
    await this.checkSearchButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear check search and reset
   */
  async clearCheckSearch(): Promise<void> {
    await this.checkSearchInput().clear();
    await this.checkSearchButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  // === TASK 14: EXPANSION PANELS ===

  /**
   * Expand an alert card to view details
   */
  async expandAlert(alertId: string): Promise<void> {
    await this.alertCardButton(alertId).click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Collapse an alert card
   */
  async collapseAlert(alertId: string): Promise<void> {
    await this.alertCardButton(alertId).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Expand a check card to view details
   */
  async expandCheck(checkId: string): Promise<void> {
    await this.checkCardButton(checkId).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Collapse a check card
   */
  async collapseCheck(checkId: string): Promise<void> {
    await this.checkCardButton(checkId).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if alert expansion details are visible
   */
  async isAlertExpanded(alertId: string): Promise<boolean> {
    const expandedContent = this.page.locator(`[data-testid="alert-details-${alertId}"]`);
    return await expandedContent.isVisible();
  }

  /**
   * Check if check expansion details are visible
   */
  async isCheckExpanded(checkId: string): Promise<boolean> {
    const expandedContent = this.page.locator(`[data-testid="check-details-${checkId}"]`);
    return await expandedContent.isVisible();
  }

  // === ACKNOWLEDGE ALERT WORKFLOW ===

  /**
   * Click acknowledge button for an alert
   */
  async clickAcknowledgeAlert(alertId: string): Promise<void> {
    await this.acknowledgeAlertButton(alertId).click();
    await expect(this.acknowledgeModal()).toBeVisible();
  }

  /**
   * Fill acknowledge modal and submit
   */
  async acknowledgeAlert(notes?: string): Promise<void> {
    if (notes) {
      await this.acknowledgeModalNotes().fill(notes);
    }
    await this.acknowledgeModalConfirm().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Cancel acknowledge modal
   */
  async cancelAcknowledge(): Promise<void> {
    await this.acknowledgeModalCancel().click();
    await expect(this.acknowledgeModal()).not.toBeVisible();
  }

  /**
   * Complete acknowledge alert workflow
   */
  async acknowledgeAlertComplete(alertId: string, notes?: string): Promise<void> {
    await this.clickAcknowledgeAlert(alertId);
    await this.acknowledgeAlert(notes);
  }

  // === RECORD CHECK WORKFLOW ===

  /**
   * Click record check button
   */
  async clickRecordCheck(checkId: string): Promise<void> {
    await this.recordCheckButton(checkId).click();
    await expect(this.recordCheckModal()).toBeVisible();
  }

  /**
   * Set check status to stable
   */
  async setCheckStatusStable(): Promise<void> {
    await this.recordCheckStatusStable().click();
  }

  /**
   * Set check status to attention
   */
  async setCheckStatusAttention(): Promise<void> {
    await this.recordCheckStatusAttention().click();
  }

  /**
   * Set check status to critical
   */
  async setCheckStatusCritical(): Promise<void> {
    await this.recordCheckStatusCritical().click();
  }

  /**
   * Add notes to check record
   */
  async addCheckNotes(notes: string): Promise<void> {
    await this.recordCheckNotes().fill(notes);
  }

  /**
   * Submit check record
   */
  async submitCheckRecord(): Promise<void> {
    await this.recordCheckConfirm().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Cancel check record modal
   */
  async cancelCheckRecord(): Promise<void> {
    await this.recordCheckCancel().click();
    await expect(this.recordCheckModal()).not.toBeVisible();
  }

  /**
   * Complete record check workflow
   */
  async recordCheckComplete(checkId: string, status: 'stable' | 'attention' | 'critical', notes?: string): Promise<void> {
    await this.clickRecordCheck(checkId);
    
    switch (status) {
      case 'stable':
        await this.setCheckStatusStable();
        break;
      case 'attention':
        await this.setCheckStatusAttention();
        break;
      case 'critical':
        await this.setCheckStatusCritical();
        break;
    }
    
    if (notes) {
      await this.addCheckNotes(notes);
    }
    
    await this.submitCheckRecord();
  }

  // === PAGINATION ===

  /**
   * Go to next alerts page
   */
  async nextAlertsPage(): Promise<void> {
    await this.alertsNextButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to previous alerts page
   */
  async prevAlertsPage(): Promise<void> {
    await this.alertsPrevButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to next checks page
   */
  async nextChecksPage(): Promise<void> {
    await this.checksNextButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to previous checks page
   */
  async prevChecksPage(): Promise<void> {
    await this.checksPrevButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  // === UTILITY METHODS ===

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading(): Promise<void> {
    await this.loadingSpinner().waitFor({ state: 'hidden' });
  }

  /**
   * Get first alert card's claim reference
   */
  async getFirstAlertClaim(): Promise<string | null> {
    const firstAlert = this.alertCards().first();
    return await firstAlert.locator('[data-testid^="alert-claim"]').textContent();
  }

  /**
   * Get first check card's claim reference
   */
  async getFirstCheckClaim(): Promise<string | null> {
    const firstCheck = this.checkCards().first();
    return await firstCheck.locator('[data-testid^="check-claim"]').textContent();
  }

  /**
   * Verify empty state message
   */
  async expectEmptyAlerts(): Promise<void> {
    await expect(this.page.locator('text=No alerts found')).toBeVisible();
  }

  /**
   * Verify empty state message for checks
   */
  async expectEmptyChecks(): Promise<void> {
    await expect(this.page.locator('text=No monitoring checks')).toBeVisible();
  }
}
