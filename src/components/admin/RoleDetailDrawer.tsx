import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Button,
  Input,
  AlertCircleIcon,
  CheckIcon,
  ShieldIcon,
  TrashIcon,
  XIcon,
} from '../ui';
import type { RoleDefinition, ServicePermissionGroup } from '../../types/auth';
import { PermissionsCatalogPicker } from './PermissionsCatalogPicker';
import { buildPermissionLookup } from './permissionsCatalogUtils';

export interface RoleDetailDrawerProps {
  isOpen: boolean;
  role: RoleDefinition | null;
  catalog: ServicePermissionGroup[];
  onClose: () => void;
  onSave: (
    code: string,
    payload: { name?: string; description?: string; permissions?: string[] },
  ) => Promise<void>;
  onRequestDelete?: (role: RoleDefinition) => void;
}

export const RoleDetailDrawer: React.FC<RoleDetailDrawerProps> = ({
  isOpen,
  role,
  catalog,
  onClose,
  onSave,
  onRequestDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const permissionLookup = useMemo(() => buildPermissionLookup(catalog), [catalog]);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setSelectedPermissions(role.permissions || []);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSaving(false);
    }
  }, [role]);

  if (!role) return null;

  const isWildcardRole = role.permissions?.includes('*') ?? false;

  const handleTogglePermission = (code: string) => {
    if (isWildcardRole) return;
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleToggleAllService = (serviceKey: string) => {
    if (isWildcardRole) return;
    const group = catalog.find((g) => g.serviceKey === serviceKey);
    if (!group) return;

    const groupCodes = group.permissions.map((p) => p.code);
    const allSelected = groupCodes.every((c) => selectedPermissions.includes(c));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupCodes])));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.isSystemRole && !name.trim()) {
      setErrorMsg('El nombre del rol es requerido');
      return;
    }
    if (!isWildcardRole && selectedPermissions.length === 0) {
      setErrorMsg('El rol debe tener al menos un permiso asignado');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: { name?: string; description?: string; permissions?: string[] } = {
        description: description.trim(),
      };
      if (!role.isSystemRole) {
        payload.name = name.trim();
      }
      if (!isWildcardRole) {
        payload.permissions = selectedPermissions;
      }

      await onSave(role.code, payload);
      setSuccessMsg('Permisos y datos del rol actualizados correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar el rol');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={role.name}
      subtitle={`${role.isSystemRole ? 'Rol del Sistema' : 'Rol Personalizado'} · ${role.code}`}
      width="680px"
      footer={
        <div
          style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
            justifyContent: !role.isSystemRole && onRequestDelete ? 'space-between' : 'flex-end',
            alignItems: 'center',
          }}
        >
          {!role.isSystemRole && onRequestDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRequestDelete(role)}
              style={{
                borderColor: 'var(--color-error)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrashIcon size={16} />
              <span>Eliminar rol</span>
            </Button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {successMsg && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckIcon size={18} style={{ color: '#10b981' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircleIcon size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Datos generales del rol */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Nombre del Rol"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={role.isSystemRole}
            required
          />
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción operativa del rol"
          />
        </div>

        {/* Lista de permisos asignados actualmente (mostrados por descripción legible + tooltip con código) */}
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-ink)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              Permisos incluidos (
              {isWildcardRole ? 'Acceso Total (*)' : selectedPermissions.length})
            </span>
            {!isWildcardRole && (
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-muted)' }}>
                Pasa el cursor sobre un permiso para ver su código
              </span>
            )}
          </div>

          {isWildcardRole ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldIcon size={16} />
              <span>Control Total del Sistema (*) — Este rol posee acceso irrestricto a todos los microservicios.</span>
            </div>
          ) : selectedPermissions.length === 0 ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                border: '1px dashed var(--color-border)',
                color: 'var(--color-muted)',
                fontSize: '12px',
              }}
            >
              Este rol no tiene permisos seleccionados. Elige al menos uno en el catálogo inferior.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '10px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
              }}
            >
              {selectedPermissions.map((code) => {
                const meta = permissionLookup.get(code);
                const displayText = meta ? meta.label : code;

                return (
                  <span
                    key={code}
                    title={code}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    <span>{displayText}</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission(code)}
                      aria-label={`Quitar permiso ${displayText}`}
                      title={`Quitar ${code}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <XIcon size={13} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Catálogo con sidebar para agregar / quitar permisos */}
        {!isWildcardRole && (
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-ink)',
                marginBottom: '8px',
              }}
            >
              Agregar o quitar permisos del catálogo
            </div>
            <PermissionsCatalogPicker
              catalog={catalog}
              selectedPermissions={selectedPermissions}
              onTogglePermission={handleTogglePermission}
              onToggleAllService={handleToggleAllService}
              height="320px"
            />
          </div>
        )}
      </form>
    </Drawer>
  );
};
