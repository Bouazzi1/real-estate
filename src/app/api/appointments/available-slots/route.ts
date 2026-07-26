import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/appointments";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const slots = await getAvailableSlotsForDate(date);
    return NextResponse.json(slots.map(s => s.toISOString()));
  } catch (e) {
    console.error("Failed to get available slots:", e);
    return NextResponse.json({ error: "Failed to load slots" }, { status: 550 });
  }
}
