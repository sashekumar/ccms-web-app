import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Dashboard initialization
  }
}
