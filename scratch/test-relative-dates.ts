function resolveRelativeDate(input?: string, timeStr?: string): Date {
  const now = new Date("2026-07-28T16:59:18+01:00"); // Current simulated time: Tuesday 28 July 2026
  if (!input || input.trim() === "") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }

  // If already valid ISO or standard date string with year 2026+
  const directParse = new Date(input);
  if (!isNaN(directParse.getTime()) && directParse.getFullYear() >= 2026) {
    return directParse;
  }

  // Handle day names (lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche)
  const lower = input.toLowerCase().trim();
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const targetDayIdx = dayNames.findIndex((day) => lower.includes(day));

  if (targetDayIdx !== -1) {
    const currentDayIdx = now.getDay();
    let diff = targetDayIdx - currentDayIdx;
    if (diff <= 0) diff += 7; // Target next occurrence of that weekday

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);

    if (timeStr) {
      const match = timeStr.match(/(\d{1,2})[h:]?(\d{2})?/i);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = parseInt(match[2] || "0", 10);
        targetDate.setHours(hours, mins, 0, 0);
      } else {
        targetDate.setHours(10, 0, 0, 0);
      }
    } else {
      targetDate.setHours(10, 0, 0, 0);
    }
    return targetDate;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

console.log("Today is Tuesday 28 July 2026.");
console.log("Input: 'Jeudi' + '8h00' ->", resolveRelativeDate("Jeudi", "8h00").toString());
console.log("Input: 'ce jeudi' + '8:00' ->", resolveRelativeDate("ce jeudi", "8:00").toString());
console.log("Input: 'vendredi' + '14h30' ->", resolveRelativeDate("vendredi", "14h30").toString());
console.log("Input: 'samedi' ->", resolveRelativeDate("samedi").toString());
