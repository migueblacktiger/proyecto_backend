export const PERMISSION_OPERATIONS = [
  'Ver',
  'Listar',
  'Crear',
  'Actualizar',
  'Eliminar'
] as const;

export type PermissionOperation = typeof PERMISSION_OPERATIONS[number];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export type HttpMethod = typeof HTTP_METHODS[number];

export interface Permission {
  id: string;
  module: string;
  resource: string;
  operation: PermissionOperation;
  url: string;
  httpMethod: HttpMethod;
  model: string;
  roleNames: string[];
  legacyAssigned: boolean;
  icon: string;
}

export type PermissionDraft = Pick<
  Permission,
  'module' | 'resource' | 'operation' | 'url' | 'httpMethod' | 'model'
>;

export interface PermissionMatrixRow {
  name: string;
  icon: string;
  group: string;
  values: boolean[];
}

export interface PermissionDeleteResult {
  permission: Permission;
  detachedRoleNames: string[];
}
