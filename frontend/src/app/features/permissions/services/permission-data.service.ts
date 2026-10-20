import { Injectable, computed, signal } from '@angular/core';
import {
  HTTP_METHODS,
  HttpMethod,
  PERMISSION_OPERATIONS,
  Permission,
  PermissionDeleteResult,
  PermissionDraft,
  PermissionMatrixRow,
  PermissionOperation
} from '../models/permission.model';

interface PermissionSeed {
  module: string;
  resource: string;
  icon: string;
  assignments: readonly boolean[];
}

const INITIAL_PERMISSION_SEEDS: readonly PermissionSeed[] = [
  { module: 'Administración', resource: 'Usuarios', icon: '♙', assignments: [true, true, true, true, false] },
  { module: 'Administración', resource: 'Roles', icon: '♙', assignments: [true, true, false, true, true] },
  { module: 'Administración', resource: 'Permisos', icon: '⚿', assignments: [false, true, true, true, true] },
  { module: 'Gestión deportiva', resource: 'Torneos', icon: '♜', assignments: [true, true, true, true, false] },
  { module: 'Gestión deportiva', resource: 'Equipos', icon: '♧', assignments: [true, true, true, true, false] },
  { module: 'Gestión deportiva', resource: 'Jugadores', icon: '♙', assignments: [true, true, true, true, true] },
  { module: 'Gestión deportiva', resource: 'Partidos', icon: '⚽', assignments: [true, true, true, true, true] },
  { module: 'Comercial', resource: 'Entradas', icon: '▤', assignments: [true, true, true, true, true] },
  { module: 'Infraestructura', resource: 'Escenarios', icon: '▦', assignments: [true, true, true, true, false] },
  { module: 'Reportes', resource: 'Reportes', icon: '▥', assignments: [true, true, false, true, false] }
];

const INITIAL_ROLES = ['Administrador', 'Coordinador', 'Operador', 'Consulta', 'Juez Deportivo'];

const METHOD_BY_OPERATION: Record<PermissionOperation, HttpMethod> = {
  Ver: 'GET',
  Listar: 'GET',
  Crear: 'POST',
  Actualizar: 'PUT',
  Eliminar: 'DELETE'
};

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

function createInitialPermissions(): Permission[] {
  return INITIAL_PERMISSION_SEEDS.flatMap(seed =>
    PERMISSION_OPERATIONS.map((operation, index) => ({
      id: `PER-${String(INITIAL_PERMISSION_SEEDS.indexOf(seed) * PERMISSION_OPERATIONS.length + index + 1).padStart(3, '0')}`,
      module: seed.module,
      resource: seed.resource,
      operation,
      url: '',
      httpMethod: METHOD_BY_OPERATION[operation],
      model: seed.resource,
      roleNames: [],
      legacyAssigned: seed.assignments[index],
      icon: seed.icon
    }))
  );
}

@Injectable({ providedIn: 'root' })
export class PermissionDataService {
  private readonly permissionState = signal<Permission[]>(createInitialPermissions());
  private readonly roleState = signal<string[]>([...INITIAL_ROLES]);

  readonly permissions = this.permissionState.asReadonly();
  readonly roles = this.roleState.asReadonly();
  readonly legacyMatrixRows = computed<PermissionMatrixRow[]>(() => {
    const permissions = this.permissionState();
    const rows = new Map<string, PermissionMatrixRow>();

    for (const permission of permissions) {
      const key = `${normalize(permission.module)}|${normalize(permission.resource)}`;
      let row = rows.get(key);

      if (!row) {
        row = {
          name: permission.resource,
          icon: permission.icon,
          group: permission.module,
          values: PERMISSION_OPERATIONS.map(() => false)
        };
        rows.set(key, row);
      }

      const operationIndex = PERMISSION_OPERATIONS.indexOf(permission.operation);
      row.values[operationIndex] = permission.legacyAssigned;
    }

    return [...rows.values()];
  });

  getPermission(id: string): Permission | undefined {
    return this.permissionState().find(permission => permission.id === id);
  }

  hasDuplicate(resource: string, operation: PermissionOperation, excludedId?: string): boolean {
    const resourceKey = normalize(resource);
    return this.permissionState().some(permission =>
      permission.id !== excludedId &&
      normalize(permission.resource) === resourceKey &&
      permission.operation === operation
    );
  }

  createPermission(draft: PermissionDraft): Permission | undefined {
    if (this.hasDuplicate(draft.resource, draft.operation)) {
      return undefined;
    }

    const nextNumber = this.permissionState().reduce((highest, permission) => {
      const number = Number(permission.id.slice(4));
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0) + 1;
    const permission: Permission = {
      ...draft,
      id: `PER-${String(nextNumber).padStart(3, '0')}`,
      roleNames: [],
      legacyAssigned: false,
      icon: '⚿'
    };

    this.permissionState.update(permissions => [...permissions, permission]);
    return permission;
  }

  updatePermission(id: string, draft: PermissionDraft): Permission | undefined {
    const current = this.getPermission(id);
    if (!current || this.hasDuplicate(draft.resource, draft.operation, id)) {
      return undefined;
    }

    const updated: Permission = { ...current, ...draft };
    this.permissionState.update(permissions =>
      permissions.map(permission => permission.id === id ? updated : permission)
    );
    return updated;
  }

  deletePermission(id: string): PermissionDeleteResult | undefined {
    const permission = this.getPermission(id);
    if (!permission) {
      return undefined;
    }

    this.permissionState.update(permissions =>
      permissions.filter(current => current.id !== id)
    );
    return {
      permission,
      detachedRoleNames: [...permission.roleNames]
    };
  }

  toggleLegacyAssignment(resource: string, operationIndex: number): void {
    const operation = PERMISSION_OPERATIONS[operationIndex];
    if (!operation) {
      throw new RangeError(`Unknown permission operation index: ${operationIndex}`);
    }

    const permission = this.permissionState().find(current =>
      normalize(current.resource) === normalize(resource) &&
      current.operation === operation
    );
    if (!permission) {
      throw new Error(`Permission "${resource} - ${operation}" is not in the catalog.`);
    }

    this.permissionState.update(permissions =>
      permissions.map(current =>
        current.id === permission.id
          ? { ...current, legacyAssigned: !current.legacyAssigned }
          : current
      )
    );
  }

  attachPermissionToRole(id: string, roleName: string): boolean {
    const permission = this.getPermission(id);
    if (!permission || !this.roleState().includes(roleName) || permission.roleNames.includes(roleName)) {
      return false;
    }

    this.permissionState.update(permissions =>
      permissions.map(current =>
        current.id === id
          ? { ...current, roleNames: [...current.roleNames, roleName] }
          : current
      )
    );
    return true;
  }
}
