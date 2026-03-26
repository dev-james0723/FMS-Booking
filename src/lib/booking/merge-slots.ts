export type SlotLike = {
  startsAt: Date;
  endsAt: Date;
  venueLabel: string | null;
};

export type MergedSlotRange = {
  start: Date;
  end: Date;
  venueLabel: string | null;
  sessionCount: number;
};

/** 將同一場地、首尾相連的 30 分鐘節數合併為一段顯示（例如 08:00–09:30 = 3 節）。 */
export function mergeConsecutiveSlots(slots: SlotLike[]): MergedSlotRange[] {
  const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const out: MergedSlotRange[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    const sameVenue = (last?.venueLabel ?? null) === (s.venueLabel ?? null);
    if (
      last &&
      sameVenue &&
      last.end.getTime() === s.startsAt.getTime()
    ) {
      last.end = s.endsAt;
      last.sessionCount += 1;
    } else {
      out.push({
        start: s.startsAt,
        end: s.endsAt,
        venueLabel: s.venueLabel,
        sessionCount: 1,
      });
    }
  }
  return out;
}
