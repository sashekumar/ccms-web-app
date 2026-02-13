import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * User profile component
 * Placeholder for future implementation
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto max-w-4xl">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Profile management coming soon...</p>
      </div>
    </div>
  `
})
export class ProfileComponent {}
