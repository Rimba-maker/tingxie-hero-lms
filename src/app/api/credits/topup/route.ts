import { NextResponse } from "next/server";

import { supabaseTopUpCreditsDb, topUpCredits } from "@/entities/student/api/topUpCredits";
import { CURRENT_STUDENT_ID } from "@/shared/config/currentStudent";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export async function POST() {
  try {
    const result = await topUpCredits(supabaseTopUpCreditsDb(getSupabaseServer()), CURRENT_STUDENT_ID);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Top up failed, please try again" }, { status: 500 });
  }
}
