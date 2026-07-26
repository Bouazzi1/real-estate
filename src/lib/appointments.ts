import { prisma } from "./prisma";

// Generate available slots (Monday-Friday, 9 AM - 6 PM, hourly)
export async function getAvailableSlotsForDate(date: Date): Promise<Date[]> {
  const dayOfWeek = date.getDay();
  
  // Weekend check: 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [];
  }

  // Set start and end hours
  const startHour = 9;  // 9:00 AM
  const endHour = 18;   // 6:00 PM (last slot starts at 5:00 PM)

  const slots: Date[] = [];
  const baseDate = new Date(date);
  baseDate.setMinutes(0);
  baseDate.setSeconds(0);
  baseDate.setMilliseconds(0);

  // Generate hourly slots
  for (let hour = startHour; hour < endHour; hour++) {
    const slotDate = new Date(baseDate);
    slotDate.setHours(hour);
    
    // Only include future slots
    if (slotDate.getTime() > Date.now()) {
      slots.push(slotDate);
    }
  }

  if (slots.length === 0) return [];

  // Query conflicting APPROVED appointments for this date
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0);
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      status: "APPROVED",
      requestedSlot: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      requestedSlot: true,
    },
  });

  const bookedTimestamps = new Set(
    bookedAppointments.map((appt) => appt.requestedSlot.getTime())
  );

  // Filter out slots that are already booked
  return slots.filter((slot) => !bookedTimestamps.has(slot.getTime()));
}
