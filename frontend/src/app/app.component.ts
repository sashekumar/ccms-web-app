import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  standalone: true,
  imports: [RouterOutlet]
})
export class AppComponent {
  title = 'CCMS - Claims Management System';
}
