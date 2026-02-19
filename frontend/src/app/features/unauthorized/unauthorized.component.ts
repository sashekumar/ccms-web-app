import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

/**
 * Unauthorized/Access Denied page
 * Displayed when user tries to access resources without proper permissions
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div class="w-full max-w-md text-center">
        <!-- Icon -->
        <div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <svg
            class="h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <!-- Title -->
        <h1 class="mb-3 text-4xl font-bold text-gray-900">Access Denied</h1>

        <!-- Message -->
        <p class="mb-8 text-lg text-gray-600">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>

        <!-- Actions -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            (click)="goBack()"
            class="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go Back
          </button>
          <button
            (click)="goToDashboard()"
            class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Go to Dashboard
          </button>
        </div>

        <!-- Additional Info -->
        <div class="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p class="font-semibold">Need Access?</p>
          <p class="mt-1">Contact your system administrator to request the necessary permissions.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
