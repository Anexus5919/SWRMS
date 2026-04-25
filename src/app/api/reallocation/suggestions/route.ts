import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { generateReallocationSuggestions } from '@/lib/engine/reallocation';
import { computeStaffingRatios } from '@/lib/engine/staffing-ratio';
import { todayIST } from '@/lib/utils/timezone';

/**
 * GET /api/reallocation/suggestions - Engine-computed reallocation suggestions
 * plus a staffing summary so the UI can distinguish "all routes adequately
 * staffed" from "critical routes exist but no surplus to redistribute from".
 */
export async function GET() {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  const today = todayIST();
  const [suggestions, ratios] = await Promise.all([
    generateReallocationSuggestions(today),
    computeStaffingRatios(today),
  ]);

  const staffing = {
    totalRoutes: ratios.length,
    critical: ratios.filter((r) => r.status === 'critical').length,
    marginal: ratios.filter((r) => r.status === 'marginal').length,
    adequate: ratios.filter((r) => r.status === 'adequate').length,
    surplus: ratios.filter((r) => r.ratio > 1.0).length,
    criticalRouteCodes: ratios
      .filter((r) => r.status === 'critical')
      .map((r) => r.routeCode),
  };

  return NextResponse.json({
    success: true,
    data: { suggestions, staffing },
  });
}
