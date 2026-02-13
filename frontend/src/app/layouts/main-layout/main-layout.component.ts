import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarService } from '../../core/services/sidebar.service';

/**
 * Main layout component with top navbar and collapsible sidebar
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './main-layout.component.html',
  styles: []
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  private sidebarSubscription?: Subscription;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.sidebarSubscription = this.sidebarService.isSidebarOpen$.subscribe(
      isOpen => this.isSidebarOpen = isOpen
    );
  }

  ngOnDestroy(): void {
    this.sidebarSubscription?.unsubscribe();
  }
}

