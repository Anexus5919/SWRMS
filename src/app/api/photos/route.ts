import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { GeoPhoto, User, VerificationLog, Attendance, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { uploadPhotoSchema, MAX_PHOTO_BASE64_LENGTH } from '@/lib/validators/schemas';
import { compareFaceDescriptors } from '@/lib/face/compare';
import { todayIST } from '@/lib/utils/timezone';

/**
 * POST /api/photos - Upload a geotagged photo with face verification
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('staff');
  if (error) return error;

  // Defensive payload-size check before parsing JSON. ~1.4MB photo + ~3KB
  // descriptor + envelope. Anything over 1.6MB is rejected up-front to
  // avoid OOM on giant uploads.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PHOTO_BASE64_LENGTH + 200_000) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Photo exceeds size limit' },
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
    const parsed = uploadPhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { type, photo, coordinates, faceDescriptor, facesCount, faceDetected, deviceInfo } = parsed.data;
    const userId = session!.user.id;
    const today = todayIST();

    // Get user and their assigned route
    const user = await User.findById(userId);
    if (!user?.assignedRouteId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ROUTE', message: 'No route assigned' } },
        { status: 400 }
      );
    }

    // Verify attendance was marked first (for shift_start photos)
    if (type === 'shift_start') {
      const attendance = await Attendance.findOne({ userId, date: today, status: 'verified' });
      if (!attendance) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_ATTENDANCE', message: 'Mark attendance before uploading shift start photo' } },
          { status: 400 }
        );
      }
    }

    // Face verification against registered descriptor
    let verificationResult: {
      confidence: 'high' | 'medium' | 'low' | 'no_match' | 'no_face';
      distance: number | null;
      verified: boolean;
      requiresManualReview: boolean;
      message: string;
    } = {
      confidence: 'no_face',
      distance: null,
      verified: false,
      requiresManualReview: false,
      message: 'No face detected in photo',
    };

    let manualReviewStatus: 'pending' | 'not_required' = 'not_required';

    if (faceDetected && faceDescriptor && user.faceDescriptor && user.faceDescriptor.length === 128) {
      const comparison = compareFaceDescriptors(faceDescriptor, user.faceDescriptor as number[]);
      verificationResult = {
        confidence: comparison.confidence,
        distance: comparison.distance,
        verified: comparison.verified,
        requiresManualReview: comparison.requiresManualReview,
        message: comparison.message,
      };

      if (comparison.requiresManualReview) {
        manualReviewStatus = 'pending';
      }
    } else if (faceDetected && faceDescriptor && !user.faceDescriptor) {
      // User has no registered face - flag for review
      verificationResult = {
        confidence: 'low',
        distance: null,
        verified: false,
        requiresManualReview: true,
        message: 'No reference face registered for this worker',
      };
      manualReviewStatus = 'pending';
    } else if (!faceDetected) {
      manualReviewStatus = 'pending';
    }

    // Save the geotagged photo
    const geoPhoto = await GeoPhoto.create({
      userId,
      routeId: user.assignedRouteId,
      date: today,
      type,
      photo,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
        accuracy: coordinates.accuracy,
      },
      faceDetected: faceDetected ?? false,
      facesCount: facesCount ?? 0,
      faceDescriptor: faceDescriptor || null,
      verificationResult,
      manualReview: {
        status: manualReviewStatus,
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
      },
      deviceInfo: deviceInfo || {},
    });

    // Create verification log if there's an issue
    if (!faceDetected) {
      await VerificationLog.create({
        type: 'no_face_detected',
        severity: 'warning',
        routeId: user.assignedRouteId,
        date: today,
        affectedUserId: userId,
        geoPhotoId: geoPhoto._id,
        details: {
          message: `No face detected in ${type} photo from ${user.name.first} ${user.name.last} (${user.employeeId})`,
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        },
      });
    } else if (verificationResult.confidence === 'no_match') {
      await VerificationLog.create({
        type: 'face_mismatch',
        severity: 'critical',
        routeId: user.assignedRouteId,
        date: today,
        affectedUserId: userId,
        geoPhotoId: geoPhoto._id,
        details: {
          message: `Face mismatch for ${user.name.first} ${user.name.last} (${user.employeeId}) - distance: ${verificationResult.distance}`,
          faceDistance: verificationResult.distance ?? undefined,
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        },
      });
    } else if (verificationResult.confidence === 'low') {
      await VerificationLog.create({
        type: 'face_mismatch',
        severity: 'warning',
        routeId: user.assignedRouteId,
        date: today,
        affectedUserId: userId,
        geoPhotoId: geoPhoto._id,
        details: {
          message: `Low confidence face match for ${user.name.first} ${user.name.last} (${user.employeeId}) - distance: ${verificationResult.distance}`,
          faceDistance: verificationResult.distance ?? undefined,
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: geoPhoto._id,
        type: geoPhoto.type,
        verificationResult,
        manualReviewRequired: manualReviewStatus === 'pending',
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Photo upload error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload photo' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/photos - List geotagged photos (supervisor/admin)
 */
export async function GET(req: NextRequest) {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || todayIST();
    const routeId = searchParams.get('routeId');
    const reviewStatus = searchParams.get('reviewStatus');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const filter: Record<string, unknown> = { date };
    if (routeId) filter.routeId = routeId;
    if (reviewStatus) filter['manualReview.status'] = reviewStatus;

    const [photos, total] = await Promise.all([
      GeoPhoto.find(filter)
        .select('-photo -faceDescriptor') // Exclude large fields from list
        .populate('userId', 'employeeId name')
        .populate('routeId', 'name code')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GeoPhoto.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: photos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch photos' } },
      { status: 500 }
    );
  }
}
