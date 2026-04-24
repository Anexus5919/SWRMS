import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/connection';
import { User, Route } from '@/lib/db/models';
import { requireRole } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit';

interface CSVRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  password: string;
  routeCode?: string;
}

interface ImportResult {
  row: number;
  status: 'created' | 'skipped' | 'failed';
  employeeId: string;
  message?: string;
}

/**
 * POST /api/staff/bulk-import — Bulk staff import from parsed CSV.
 * Body: { rows: CSVRow[] }
 * Returns per-row result for transparency.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    await connectDB();

    const body = await req.json();
    const rows: CSVRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'rows[] required' } },
        { status: 400 }
      );
    }

    if (rows.length > 200) {
      return NextResponse.json(
        { success: false, error: { code: 'TOO_LARGE', message: 'Max 200 rows per import' } },
        { status: 400 }
      );
    }

    // Pre-fetch routes for code -> id mapping
    const routeCodes: string[] = [...new Set(rows.map(r => r.routeCode).filter((c): c is string => !!c))];
    const routes = routeCodes.length
      ? await Route.find({ code: { $in: routeCodes } }).select('_id code').lean()
      : [];
    const routeByCode = new Map(routes.map(r => [r.code, r._id]));

    const results: ImportResult[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 = 1-indexed + header row

      // Validate required fields
      if (!row.employeeId || !row.firstName || !row.lastName || !row.role || !row.phone || !row.password) {
        results.push({ row: rowNum, status: 'failed', employeeId: row.employeeId || '?', message: 'Missing required field' });
        failed++;
        continue;
      }

      const empId = row.employeeId.trim().toUpperCase();

      // Check duplicate
      const existing = await User.findOne({ employeeId: empId }).select('_id').lean();
      if (existing) {
        results.push({ row: rowNum, status: 'skipped', employeeId: empId, message: 'Already exists' });
        skipped++;
        continue;
      }

      // Validate role
      if (!['admin', 'supervisor', 'staff'].includes(row.role)) {
        results.push({ row: rowNum, status: 'failed', employeeId: empId, message: `Invalid role: ${row.role}` });
        failed++;
        continue;
      }

      // Resolve route if specified
      let assignedRouteId: any = null;
      if (row.routeCode) {
        const routeId = routeByCode.get(row.routeCode);
        if (!routeId) {
          results.push({ row: rowNum, status: 'failed', employeeId: empId, message: `Route ${row.routeCode} not found` });
          failed++;
          continue;
        }
        assignedRouteId = routeId;
      }

      try {
        const passwordHash = await bcrypt.hash(row.password, 10);
        await User.create({
          employeeId: empId,
          name: { first: row.firstName.trim(), last: row.lastName.trim() },
          role: row.role,
          phone: row.phone.trim(),
          passwordHash,
          assignedRouteId,
        });
        results.push({ row: rowNum, status: 'created', employeeId: empId });
        created++;
      } catch (err) {
        results.push({ row: rowNum, status: 'failed', employeeId: empId, message: err instanceof Error ? err.message : 'Insert failed' });
        failed++;
      }
    }

    // Audit log entry
    await logAudit({
      action: 'bulk_import.staff',
      category: 'bulk',
      actorId: session!.user.id,
      actorEmployeeId: (session!.user as any).employeeId,
      actorRole: 'admin',
      targetLabel: `Bulk import: ${created} created, ${skipped} skipped, ${failed} failed`,
      metadata: { totalRows: rows.length, created, skipped, failed },
      req,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRows: rows.length,
        created,
        skipped,
        failed,
        results,
      },
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Bulk import failed' } },
      { status: 500 }
    );
  }
}
