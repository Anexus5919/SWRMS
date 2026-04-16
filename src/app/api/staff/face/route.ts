import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';

/**
 * POST /api/staff/face — Register face descriptor for current user
 * Called after face-api.js extracts the 128-d embedding on the client
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const { profilePhoto, faceDescriptor } = body;

    if (!profilePhoto || typeof profilePhoto !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PHOTO', message: 'Profile photo is required' } },
        { status: 400 }
      );
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DESCRIPTOR', message: 'Valid 128-dimension face descriptor is required' } },
        { status: 400 }
      );
    }

    // Validate all values are finite numbers
    if (faceDescriptor.some((v: unknown) => typeof v !== 'number' || !isFinite(v as number))) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DESCRIPTOR', message: 'Face descriptor contains invalid values' } },
        { status: 400 }
      );
    }

    const userId = session!.user.id;

    await User.findByIdAndUpdate(userId, {
      profilePhoto,
      faceDescriptor,
      faceRegisteredAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Face registered successfully', registeredAt: new Date() },
    });
  } catch (err) {
    console.error('Face registration error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to register face' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/staff/face — Check if current user has face registered
 */
export async function GET() {
  const { session, error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const user = await User.findById(session!.user.id)
      .select('faceDescriptor faceRegisteredAt profilePhoto')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        hasRegisteredFace: !!(user?.faceDescriptor && user.faceDescriptor.length === 128),
        registeredAt: user?.faceRegisteredAt || null,
        hasProfilePhoto: !!user?.profilePhoto,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to check face status' } },
      { status: 500 }
    );
  }
}
