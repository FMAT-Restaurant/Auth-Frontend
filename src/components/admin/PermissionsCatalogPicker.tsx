import React, { useState, useMemo } from 'react';
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

interface PermissionsCatalogPickerProps {
  catalog: ServicePermissionGroup[];
  selectedPermissions: string[];
  onTogglePermission: (code: string) => void;
  onToggleAllService: (serviceKey: string) => void;
  disabled?: boolean;
  height?: string;
}

export const PermissionsCatalogPicker: React.FC<PermissionsCatalogPickerProps> = ({
  catalog,
  selectedPermissions,
  onTogglePermission,
  onToggleAllService,
  disabled = false,
  height = '360px',
}) => {
  const [activeService, setActiveService] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const baseGroups =
      activeService === 'all'
        ? catalog
        : catalog.filter((g) => g.serviceKey === activeService);

    if (!normalizedQuery) return baseGroups;

    return baseGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(normalizedQuery) ||
            p.description.toLowerCase().includes(normalizedQuery) ||
            p.code.toLowerCase().includes(normalizedQuery) ||
            group.serviceName.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [catalog, activeService, normalizedQuery]);

  const totalCatalogCount = useMemo(
    () => catalog.reduce((acc, g) => acc + g.permissions.length, 0),
    [catalog],
  );

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-control)',
        backgroundColor: 'var(--color-surface)',
        overflow: 'hidden',
        height,
        minHeight: '280px',
      }}
    >
      {/* Sidebar de filtro por microservicio */}
      <aside
        aria-label="Filtrar permisos por microservicio"
        style={{
          width: '210px',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-elevated)',
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveService('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            textAlign: 'left',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeService === 'all' ? 700 : 500,
            backgroundColor:
              activeService === 'all' ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
            color:
              activeService === 'all' ? 'var(--color-primary)' : 'var(--color-ink)',
          }}
        >
          <span>Todos</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color:
                activeService === 'all' ? 'var(--color-primary)' : 'var(--color-muted)',
            }}
          >
            {selectedPermissions.length}/{totalCatalogCount}
          </span>
        </button>

        {catalog.map((group) => {
          const selectedInGroup = group.permissions.filter((p) =>
            selectedPermissions.includes(p.code),
          ).length;
          const isActive = activeService === group.serviceKey;

          return (
            <button
              key={group.serviceKey}
              type="button"
              onClick={() => setActiveService(group.serviceKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={group.serviceName}
              >
                {group.serviceName}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor:
                    selectedInGroup > 0
                      ? 'rgba(234, 88, 12, 0.15)'
                      : 'rgba(107, 114, 128, 0.12)',
                  color:
                    selectedInGroup > 0 ? 'var(--color-primary)' : 'var(--color-muted)',
                }}
              >
                {selectedInGroup}/{group.permissions.length}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Panel derecho: búsqueda + lista de permisos */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar permiso por descripción o código..."
            aria-label="Buscar permiso en el catálogo"
            style={{
              width: '100%',
              padding: '7px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-ink)',
              outline: 'none',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {filteredGroups.length === 0 ? (
            <div
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--color-muted)',
              }}
            >
              No se encontraron permisos que coincidan con &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const groupCodes = group.permissions.map((p) => p.code);
              const allSelected =
                groupCodes.length > 0 &&
                groupCodes.every((c) => selectedPermissions.includes(c));

              return (
                <div
                  key={group.serviceKey}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {group.serviceName}
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleAllService(group.serviceKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: disabled ? 'var(--color-muted)' : 'var(--color-primary)',
                        fontSize: '12px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '6px',
                    }}
                  >
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.code);
                      return (
                        <label
                          key={perm.code}
                          title={perm.code}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isChecked
                              ? 'rgba(234, 88, 12, 0.06)'
                              : 'transparent',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.65 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => onTogglePermission(perm.code)}
                            style={{
                              accentColor: 'var(--color-primary)',
                              width: '15px',
                              height: '15px',
                              marginTop: '2px',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--color-ink)',
                              }}
                            >
                              {perm.label}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--color-muted)',
                                lineHeight: 1.3,
                              }}
                            >
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
