import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: string;
  name: { first: string; last: string };
  role: 'admin' | 'supervisor' | 'staff';
  ward: string;
  phone: string;
  passwordHash: string;
  assignedRouteId: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true },
  },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'staff'],
    required: true,
    index: true,
  },
  ward: {
    type: String,
    default: 'Chembur',
  },
  phone: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  assignedRouteId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.index({ assignedRouteId: 1, role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
