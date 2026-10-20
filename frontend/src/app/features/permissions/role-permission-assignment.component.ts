import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import {
  PERMISSION_OPERATIONS,
  Permission,
  RolePermissionMatrixRow
} from './models/permission.model';
import { PermissionDataService } from './services/permission-data.service';

function sameIds(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every(id => right.has(id));
}

@Component({
  selector: 'app-role-permission-assignment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-permission-assignment.component.html',
  styleUrl: './role-permission-assignment.component.css'
})
export class RolePermissionAssignmentComponent implements OnDestroy {
  private readonly permissionData = inject(PermissionDataService);

  readonly roles = this.permissionData.roles;
  readonly permissions = this.permissionData.permissions;
  readonly operations = PERMISSION_OPERATIONS;
  readonly selectedRole = signal(this.roles()[0] ?? '');
  readonly draftPermissionIds = signal<ReadonlySet<string>>(new Set());
  readonly savedPermissionIds = computed(() => new Set(
    this.permissionData.getPermissionsForRole(this.selectedRole()).map(permission => permission.id)
  ));
  readonly availableDraftPermissionIds = computed(() => {
    const availableIds = new Set(this.permissions().map(permission => permission.id));
    return new Set([...this.draftPermissionIds()].filter(id => availableIds.has(id)));
  });
  readonly hasPendingChanges = computed(() =>
    !sameIds(this.availableDraftPermissionIds(), this.savedPermissionIds())
  );
  readonly matrixRows = computed<RolePermissionMatrixRow[]>(() => {
    const rows = new Map<string, RolePermissionMatrixRow>();

    for (const permission of this.permissions()) {
      const key = `${permission.module.trim().toLocaleLowerCase()}|${permission.resource.trim().toLocaleLowerCase()}`;
      let row = rows.get(key);
      if (!row) {
        row = {
          module: permission.module,
          resource: permission.resource,
          icon: permission.icon,
          permissions: {}
        };
        rows.set(key, row);
      }
      row.permissions[permission.operation] = permission;
    }

    return [...rows.values()].sort((left, right) =>
      left.module.localeCompare(right.module) || left.resource.localeCompare(right.resource)
    );
  });
  readonly matrixGroups = computed(() => {
    const groups = new Map<string, RolePermissionMatrixRow[]>();
    for (const row of this.matrixRows()) {
      const rows = groups.get(row.module) ?? [];
      rows.push(row);
      groups.set(row.module, rows);
    }
    return [...groups].map(([module, rows]) => ({ module, rows }));
  });
  readonly assignedCount = computed(() => this.availableDraftPermissionIds().size);

  toast = '';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.restoreSavedAssignments();
  }

  selectRole(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('Role selection event did not originate from a select element.');
    }

    const roleName = select.value;
    if (!this.roles().includes(roleName) || roleName === this.selectedRole()) {
      return;
    }

    if (this.hasPendingChanges() && !confirm('Hay cambios sin guardar. ¿Descartarlos y cambiar de rol?')) {
      select.value = this.selectedRole();
      return;
    }

    this.selectedRole.set(roleName);
    this.restoreSavedAssignments();
  }

  isSelected(permissionId: string): boolean {
    return this.availableDraftPermissionIds().has(permissionId);
  }

  togglePermission(permission: Permission, event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('Permission checkbox event did not originate from an input.');
    }

    this.draftPermissionIds.update(current => {
      const next = new Set(current);
      if (input.checked) {
        next.add(permission.id);
      } else {
        next.delete(permission.id);
      }
      return next;
    });
  }

  saveChanges(): void {
    if (!this.selectedRole() || !this.hasPendingChanges()) {
      return;
    }

    const updated = this.permissionData.replaceRolePermissions(
      this.selectedRole(),
      [...this.availableDraftPermissionIds()]
    );
    if (!updated) {
      this.showToast('No se pudieron guardar los permisos. Verifica que el rol siga registrado.');
      return;
    }

    this.restoreSavedAssignments();
    this.showToast(`Permisos de ${this.selectedRole()} guardados correctamente.`);
  }

  cancelChanges(): void {
    if (!this.hasPendingChanges()) {
      return;
    }

    this.restoreSavedAssignments();
    this.showToast('Cambios descartados. Se restauraron los permisos guardados del rol.');
  }

  showToast(message: string): void {
    this.toast = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toast = '';
      this.toastTimer = undefined;
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private restoreSavedAssignments(): void {
    this.draftPermissionIds.set(new Set(this.savedPermissionIds()));
  }
}
