import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '../../app.types';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  @Input({ required: true }) page!: Page;
  @Input() adminMode = false;
  @Output() toggleMenu = new EventEmitter<void>();
  @Output() notification = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  get pageTitle(): string {
    const titles: Record<Page, string> = {
      home: 'Inicio',
      login: 'Iniciar sesión',
      register: 'Crear cuenta',
      forgot: 'Recuperar contraseña',
      dashboard: 'Dashboard',
      sports: 'Deportes',
      teams: 'Equipos',
      players: 'Jugadores',
      profile: 'Perfil deportivo',
      users: 'Usuarios',
      roles: 'Roles',
      permissions: 'Permisos',
      'role-permissions': 'Asignar permisos',
      'permission-management': 'Gestión de permisos',
      'role-permission-assignment': 'Asignar permisos a roles'
    };

    return titles[this.page];
  }
}
