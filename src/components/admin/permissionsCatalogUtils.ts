import type { PermissionItem, ServicePermissionGroup } from '../../types/auth';

export interface CatalogPermissionMeta extends PermissionItem {
  serviceKey: string;
  serviceName: string;
}

export function buildPermissionLookup(
  catalog: ServicePermissionGroup[],
): Map<string, CatalogPermissionMeta> {
  const map = new Map<string, CatalogPermissionMeta>();
  for (const group of catalog) {
    for (const perm of group.permissions) {
      map.set(perm.code, {
        ...perm,
        serviceKey: group.serviceKey,
        serviceName: group.serviceName,
      });
    }
  }
  return map;
}
