import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Footer component with copyright and links
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
