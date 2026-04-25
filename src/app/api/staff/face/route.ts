import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import {
  registerFaceSchema,
  MAX_PROFILE_PHOTO_BASE64_LENGTH,
} from '@/lib/validators/schemas';
import { logAudit } from '@/lib/audit';

/**
 * POST /api/staff/face - Register face descriptor for current user.
 * Called after face-api.js extracts the 128-d embedding on the client.
 *
 * NOTE: client-trusted descriptors are a known govt-grade red flag. Phase 5
 * will re-extract embeddings server-side from the raw image. Until then,
 * we at least cap the payload size and validate descriptor shape.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff', 'supervisor', 'admin');
  if (error) return error;

  // Defensive payload-size check before parsing JSON. Body is roughly:
  //   profilePhoto base64 (<=700KB) + faceDescriptor JSON (<=~2.5KB) + overhead.
  // Reject anything over 800KB up-front to avoid OOM on giant uploads.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PROFILE_PHOTO_BASE64_LENGTH + 5_000) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Profile photo exceeds size limit' },
      },
      { status: 413 }
    );
  }

  try {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
        { status: 400 }
      );
    }

    const parsed = registerFaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Invalid face registration payload',
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { profilePhoto, faceDescriptor } = parsed.data;

    if (faceDescriptor.some((v) => !isFinite(v))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DESCRIPTOR', message: 'Face descriptor contains invalid values' },
        },
        { status: 400 }
      );
    }

    const userId = session!.user.id;
    const registeredAt = new Date();

    await User.findByIdAndUpdate(userId, {
      profilePhoto,
      faceDescriptor,
      faceRegisteredAt: registeredAt,
    });

    await logAudit({
      action: 'user.face_registered',
      category: 'user',
      actorId: userId as string,
      actorEmployeeId: (session?.user as { employeeId?: string } | undefined)?.employeeId,
      actorRole: ((session?.user as { role?: 'admin' | 'supervisor' | 'staff' } | undefined)?.role) ?? 'staff',
      targetType: 'user',
      targetId: userId as string,
      metadata: { faceRegisteredAt: registeredAt.toISOString() },
      req,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Face registered successfully', registeredAt },
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
 * GET /api/staff/face - Check if current user has face registered
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
