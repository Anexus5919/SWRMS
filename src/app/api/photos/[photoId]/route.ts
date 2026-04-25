import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { GeoPhoto } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { reviewPhotoSchema } from '@/lib/validators/schemas';

/**
 * GET /api/photos/[photoId] - Get single photo with full data (including base64)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { photoId } = await params;

    const photo = await GeoPhoto.findById(photoId)
      .populate('userId', 'employeeId name profilePhoto')
      .populate('routeId', 'name code')
      .populate('manualReview.reviewedBy', 'employeeId name')
      .lean();

    if (!photo) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Photo not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: photo });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch photo' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/photos/[photoId] - Manual review (approve/reject)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { session, error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();
    const { photoId } = await params;
    const body = await req.json();

    const parsed = reviewPhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const photo = await GeoPhoto.findById(photoId);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Photo not found' } },
        { status: 404 }
      );
    }

    if (photo.manualReview.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_REVIEWED', message: 'This photo has already been reviewed' } },
        { status: 409 }
      );
    }

    photo.manualReview = {
      status: parsed.data.status,
      reviewedBy: session!.user.id as any,
      reviewedAt: new Date(),
      notes: parsed.data.notes || null,
    };

    // If approved, mark verification as verified
    if (parsed.data.status === 'approved') {
      photo.verificationResult.verified = true;
      photo.verificationResult.message = 'Manually approved by supervisor';
    }

    await photo.save();

    return NextResponse.json({ success: true, data: { id: photo._id, manualReview: photo.manualReview } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to review photo' } },
      { status: 500 }
    );
  }
}
