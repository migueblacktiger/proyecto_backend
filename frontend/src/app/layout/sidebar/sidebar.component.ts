import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '../../app.types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input({ required: true }) page!: Page;
  @Input() adminMode = false;
  @Input() mobileMenu = false;
  @Output() navigate = new EventEmitter<Page>();
  @Output() openAdmin = new EventEmitter<void>();

  isAdminPage(): boolean {
    return [
      'users',
      'roles',
      'permissions',
      'role-permissions',
      'permission-management',
      'role-permission-assignment'
    ].includes(this.page);
  }
}
