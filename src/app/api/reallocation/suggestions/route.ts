import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { generateReallocationSuggestions } from '@/lib/engine/reallocation';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * GET /api/reallocation/suggestions - Get engine-computed reallocation suggestions
 */
export async function GET() {
  const { error } = await requireRole('supervisor', 'admin');
  if (error) return error;

  const today = todayString();
  const suggestions = await generateReallocationSuggestions(today);

  return NextResponse.json({ success: true, data: suggestions });
}
