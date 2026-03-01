import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';

/**
 * Common Module
 * Contains shared business logic components used across multiple features
 * 
 * This module should contain:
 * - Common business components (status badges, avatars, etc.)
 * - Common business services (not singleton)
 * - Common domain models
 * - Common validators
 * 
 * Import this module in feature modules that need common business functionality
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    // Import standalone components
    StatusBadgeComponent
  ],
  exports: [
    // Export components for use in other modules
    StatusBadgeComponent
  ]
})
export class AppCommonModule { }
