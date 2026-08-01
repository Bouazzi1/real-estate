import { prisma } from "./prisma";

// Generate available slots (7 days a week: Mon-Fri 9 AM - 6 PM, Sat-Sun 10 AM - 5 PM)
export async function getAvailableSlotsForDate(date: Date): Promise<Date[]> {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Set start and end hours according to weekday vs weekend
  let startHour = 8;  // 8:00 AM
  let endHour = 18;   // 6:00 PM

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    startHour = 9;    // 9:00 AM on weekends
    endHour = 17;     // 5:00 PM on weekends
  }

  const slots: Date[] = [];
  const baseDate = new Date(date);
  baseDate.setMinutes(0);
  baseDate.setSeconds(0);
  baseDate.setMilliseconds(0);

  // Generate hourly slots
  for (let hour = startHour; hour < endHour; hour++) {
    const slotDate = new Date(baseDate);
    slotDate.setHours(hour);
    
    slots.push(slotDate);
  }

  if (slots.length === 0) return [];

  // Query conflicting APPROVED or PENDING appointments for this date
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
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
