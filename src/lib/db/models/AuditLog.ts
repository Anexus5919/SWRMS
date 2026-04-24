import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * AuditLog — government-grade audit trail of every consequential action.
 * Required for compliance, incident investigation, and accountability.
 */

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'user.reactivated'
  | 'user.face_registered'
  | 'route.created'
  | 'route.updated'
  | 'route.status_changed'
  | 'reallocation.created'
  | 'reallocation.approved'
  | 'reallocation.rejected'
  | 'photo.approved'
  | 'photo.rejected'
  | 'log.resolved'
  | 'log.dismissed'
  | 'login.success'
  | 'login.failed'
  | 'logout'
  | 'bulk_import.staff';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: AuditAction;
  category: 'user' | 'route' | 'reallocation' | 'verification' | 'auth' | 'bulk';
  actorId: mongoose.Types.ObjectId | null;          // who did it
  actorEmployeeId: string | null;                    // for display when actor deleted
  actorRole: 'admin' | 'supervisor' | 'staff' | 'system';
  targetType: string | null;                         // 'user' | 'route' | 'photo' etc
  targetId: string | null;                           // ObjectId of target
  targetLabel: string | null;                        // human-readable (e.g. "BMC-CHB-007 Rajesh Patil")
  changes: Record<string, { from: unknown; to: unknown }> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  ward: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    category: { type: String, enum: ['user', 'route', 'reallocation', 'verification', 'auth', 'bulk'], required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmployeeId: { type: String, default: null },
    actorRole: { type: String, enum: ['admin', 'supervisor', 'staff', 'system'], required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null, index: true },
    targetLabel: { type: String, default: null },
    changes: { type: Schema.Types.Mixed, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    ward: { type: String, default: 'Chembur', index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
