import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  HTTP_METHODS,
  HttpMethod,
  PERMISSION_OPERATIONS,
  Permission,
  PermissionDraft
} from './models/permission.model';
import { PermissionDataService } from './services/permission-data.service';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-management.component.html',
  styleUrl: './permission-management.component.css'
})
export class PermissionManagementComponent implements OnDestroy {
  private readonly permissionData = inject(PermissionDataService);

  readonly operations = PERMISSION_OPERATIONS;
  readonly httpMethods = HTTP_METHODS;
  readonly permissions = this.permissionData.permissions;
  readonly resources = computed(() =>
    [...new Set(this.permissions().map(permission => permission.module))]
      .sort((left, right) => left.localeCompare(right))
  );
  get filteredPermissions(): Permission[] {
    const search = this.search.trim().toLocaleLowerCase();
    const resource = this.resourceFilter;

    return this.permissions().filter(permission => {
      const matchesResource = resource === 'Todos' || permission.module === resource;
      const searchableText = [
        permission.id,
        permission.module,
        permission.resource,
        permission.operation,
        permission.url,
        permission.httpMethod,
        permission.model
      ].join(' ').toLocaleLowerCase();

      return matchesResource && (!search || searchableText.includes(search));
    });
  }

  search = '';
  resourceFilter = 'Todos';
  formMode: FormMode = null;
  editingId: string | null = null;
  detailId: string | null = null;
  deletingId: string | null = null;
  submitted = false;
  formError = '';
  toast = '';
  draft: PermissionDraft = this.blankDraft();
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  get detailPermission(): Permission | undefined {
    return this.detailId ? this.permissionData.getPermission(this.detailId) : undefined;
  }

  get deletingPermission(): Permission | undefined {
    return this.deletingId ? this.permissionData.getPermission(this.deletingId) : undefined;
  }

  openCreate(): void {
    this.draft = this.blankDraft();
    this.editingId = null;
    this.formMode = 'create';
    this.submitted = false;
    this.formError = '';
  }

  openEdit(permission: Permission): void {
    this.draft = {
      module: permission.module,
      resource: permission.resource,
      operation: permission.operation,
      url: permission.url,
      httpMethod: permission.httpMethod,
      model: permission.model
    };
    this.editingId = permission.id;
    this.formMode = 'edit';
    this.submitted = false;
    this.formError = '';
  }

  savePermission(form: NgForm): void {
    this.submitted = true;
    this.formError = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const draft: PermissionDraft = {
      ...this.draft,
      module: this.editingId ? this.draft.module.trim() : this.draft.resource.trim(),
      resource: this.draft.resource.trim(),
      url: this.draft.url.trim(),
      model: this.draft.model.trim()
    };
    const duplicate = this.permissionData.hasDuplicate(
      draft.resource,
      draft.operation,
      this.editingId ?? undefined
    );

    if (duplicate) {
      this.formError = 'Ya existe un permiso para este recurso y operación.';
      return;
    }

    const wasEditing = this.editingId !== null;
    const saved = this.editingId
      ? this.permissionData.updatePermission(this.editingId, draft)
      : this.permissionData.createPermission(draft);

    if (!saved) {
      this.formError = 'No se pudo guardar el permiso. Actualiza la lista e inténtalo de nuevo.';
      return;
    }

    this.closeForm();
    this.showToast(wasEditing ? 'Permiso actualizado correctamente.' : 'Permiso registrado correctamente.');
  }

  viewDetails(permission: Permission): void {
    this.detailId = permission.id;
  }

  requestDelete(permission: Permission): void {
    this.deletingId = permission.id;
  }

  confirmDelete(): void {
    if (!this.deletingId) {
      return;
    }

    const result = this.permissionData.deletePermission(this.deletingId);
    if (!result) {
      this.deletingId = null;
      this.showToast('El permiso ya no está disponible en el catálogo.');
      return;
    }

    this.deletingId = null;
    const detachedCount = result.detachedRoleNames.length;
    this.showToast(detachedCount
      ? `Permiso eliminado y separado de ${detachedCount} rol(es). Los roles siguen registrados.`
      : 'Permiso eliminado. Los roles existentes se conservaron.');
  }

  closeForm(): void {
    this.formMode = null;
    this.editingId = null;
    this.submitted = false;
    this.formError = '';
  }

  closeDetails(): void {
    this.detailId = null;
  }

  cancelDelete(): void {
    this.deletingId = null;
  }

  operationChanged(value: string): void {
    const operation = this.operations.find(candidate => candidate === value);
    if (operation) {
      this.draft.operation = operation;
    }
  }

  methodChanged(value: string): void {
    const method = this.httpMethods.find(candidate => candidate === value);
    if (method) {
      this.draft.httpMethod = method;
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
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

  private blankDraft(): PermissionDraft {
    return {
      module: '',
      resource: '',
      operation: 'Ver',
      url: '',
      httpMethod: 'GET',
      model: ''
    };
  }
}
