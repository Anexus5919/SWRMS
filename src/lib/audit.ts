import { NextRequest } from 'next/server';
import AuditLog, { type AuditAction } from './db/models/AuditLog';

interface AuditOptions {
  action: AuditAction;
  category: 'user' | 'route' | 'reallocation' | 'verification' | 'auth' | 'bulk';
  actorId?: string | null;
  actorEmployeeId?: string | null;
  actorRole: 'admin' | 'supervisor' | 'staff' | 'system';
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  metadata?: Record<string, unknown> | null;
  ward?: string;
  req?: NextRequest;
}

/**
 * Server-side audit logger. Call from any API route after a
 * consequential action. Failures are swallowed (audit must never
 * break the user-facing operation) but logged to console.
 */
export async function logAudit(opts: AuditOptions): Promise<void> {
  try {
    await AuditLog.create({
      action: opts.action,
      category: opts.category,
      actorId: opts.actorId ?? null,
      actorEmployeeId: opts.actorEmployeeId ?? null,
      actorRole: opts.actorRole,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      targetLabel: opts.targetLabel ?? null,
      changes: opts.changes ?? null,
      metadata: opts.metadata ?? null,
      ipAddress: opts.req?.headers.get('x-forwarded-for')?.split(',')[0] ?? opts.req?.headers.get('x-real-ip') ?? null,
      userAgent: opts.req?.headers.get('user-agent') ?? null,
      ward: opts.ward ?? 'Chembur',
    });
  } catch (err) {
    console.error('[audit] failed to log:', err);
  }
}
