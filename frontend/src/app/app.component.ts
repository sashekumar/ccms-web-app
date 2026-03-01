import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  standalone: true,
  imports: [RouterOutlet, ToastComponent]
})
export class AppComponent {
  title = 'CCMS - Claims Management System';
}
