import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '../../app.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  @Input() sportsCount = 0;
  @Output() navigate = new EventEmitter<Page>();
  @Output() notification = new EventEmitter<string>();
}
