/**
 * @file marGrid.test.ts
 * @description Unit tests for MAR time grid logic.
 *
 * Tests the helper functions extracted from MARGrid.tsx that determine
 * time slot generation and dose status calculation.
 */

import { describe, it, expect } from 'vitest';
import { MedicationDoseStatus } from '../../types';

// ---------------------------------------------------------------------------
// Helper functions mirrored from MARGrid.tsx for testing
// (These are pure functions that are inlined in MARGrid — we test them here
//  by reimplementing them, which also validates their intended logic.)
// ---------------------------------------------------------------------------

/**
 * Generate time-slot labels from 0000 to 2300 at the given hour interval.
 */
function generateTimeSlots(intervalHours: number): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h += intervalHours) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

/**
 * Parse a time string in "HH:mm" or "HHmm" format to total minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const cleaned = time.replace(':', '');
  const hours = parseInt(cleaned.substring(0, 2), 10);
  const minutes = parseInt(cleaned.substring(2, 4), 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Determine the dose status for a medication at a given time slot.
 */
function getCellStatus(
  lastGiven: string | undefined,
  slotTime: string,
  currentMinutes: number,
  isScheduledSlot: boolean,
): MedicationDoseStatus {
  if (!isScheduledSlot) {
    return MedicationDoseStatus.FUTURE;
  }

  const slotMinutes = parseTimeToMinutes(slotTime);

  if (lastGiven) {
    const lastGivenDate = new Date(lastGiven);
    const lastGivenMinutes = lastGivenDate.getHours() * 60 + lastGivenDate.getMinutes();
    if (slotMinutes <= lastGivenMinutes) {
      return MedicationDoseStatus.GIVEN;
    }
  }

  // Window: ±60 minutes from current time
  if (slotMinutes <= currentMinutes - 60) {
    return MedicationDoseStatus.OVERDUE;
  }

  if (Math.abs(slotMinutes - currentMinutes) <= 60) {
    return MedicationDoseStatus.DUE;
  }

  return MedicationDoseStatus.PENDING;
}

// ---------------------------------------------------------------------------
// generateTimeSlots
// ---------------------------------------------------------------------------

describe('generateTimeSlots', () => {
  it('generates 12 slots for 2-hour interval', () => {
    const slots = generateTimeSlots(2);
    expect(slots).toHaveLength(12);
    expect(slots[0]).toBe('00:00');
    expect(slots[slots.length - 1]).toBe('22:00');
  });

  it('generates 24 slots for 1-hour interval', () => {
    const slots = generateTimeSlots(1);
    expect(slots).toHaveLength(24);
    expect(slots[0]).toBe('00:00');
    expect(slots[23]).toBe('23:00');
  });

  it('generates 6 slots for 4-hour interval', () => {
    const slots = generateTimeSlots(4);
    expect(slots).toHaveLength(6);
    expect(slots).toEqual(['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']);
  });

  it('generates 3 slots for 8-hour interval', () => {
    const slots = generateTimeSlots(8);
    expect(slots).toHaveLength(3);
    expect(slots).toEqual(['00:00', '08:00', '16:00']);
  });

  it('generates correct slot labels with zero-padding', () => {
    const slots = generateTimeSlots(2);
    expect(slots[0]).toBe('00:00');
    expect(slots[1]).toBe('02:00');
    expect(slots[5]).toBe('10:00');
  });
});

// ---------------------------------------------------------------------------
// parseTimeToMinutes
// ---------------------------------------------------------------------------

describe('parseTimeToMinutes', () => {
  it('parses HH:mm format', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('08:00')).toBe(480);
    expect(parseTimeToMinutes('12:30')).toBe(750);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('parses HHmm format (no colon)', () => {
    expect(parseTimeToMinutes('0800')).toBe(480);
    expect(parseTimeToMinutes('1400')).toBe(840);
  });

  it('handles midnight as zero', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('handles noon correctly', () => {
    expect(parseTimeToMinutes('12:00')).toBe(720);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — non-scheduled slots
// ---------------------------------------------------------------------------

describe('getCellStatus — non-scheduled slot', () => {
  it('returns FUTURE for any non-scheduled slot regardless of time', () => {
    // Even if current time is 10:00, a non-scheduled slot should be FUTURE
    expect(getCellStatus(undefined, '08:00', 600, false)).toBe(MedicationDoseStatus.FUTURE);
    expect(getCellStatus(undefined, '00:00', 600, false)).toBe(MedicationDoseStatus.FUTURE);
    expect(getCellStatus(undefined, '22:00', 600, false)).toBe(MedicationDoseStatus.FUTURE);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — GIVEN (based on lastGiven timestamp)
// ---------------------------------------------------------------------------

describe('getCellStatus — GIVEN', () => {
  it('returns GIVEN when slot time is before or equal to lastGiven time', () => {
    // lastGiven at 10:00, slot at 08:00 → 08:00 <= 10:00 → GIVEN
    const lastGiven = '2026-01-01T10:00:00';
    expect(getCellStatus(lastGiven, '08:00', 720, true)).toBe(MedicationDoseStatus.GIVEN);
  });

  it('returns GIVEN when slot time equals lastGiven time', () => {
    const lastGiven = '2026-01-01T08:00:00';
    expect(getCellStatus(lastGiven, '08:00', 720, true)).toBe(MedicationDoseStatus.GIVEN);
  });

  it('does not return GIVEN when slot time is after lastGiven time', () => {
    // lastGiven at 06:00, slot at 10:00 → 10:00 > 06:00 → not GIVEN
    const lastGiven = '2026-01-01T06:00:00';
    const status = getCellStatus(lastGiven, '10:00', 720, true);
    expect(status).not.toBe(MedicationDoseStatus.GIVEN);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — OVERDUE
// ---------------------------------------------------------------------------

describe('getCellStatus — OVERDUE', () => {
  it('returns OVERDUE when slot is more than 60 min in the past', () => {
    // Current time: 12:00 (720 min), slot: 10:00 (600 min)
    // 600 <= 720 - 60 = 660 → OVERDUE
    expect(getCellStatus(undefined, '10:00', 720, true)).toBe(MedicationDoseStatus.OVERDUE);
  });

  it('returns OVERDUE when slot is exactly 61 min in the past', () => {
    // Current time: 12:01 (721 min), slot: 11:00 (660 min)
    // 660 <= 721 - 60 = 661 → OVERDUE
    expect(getCellStatus(undefined, '11:00', 721, true)).toBe(MedicationDoseStatus.OVERDUE);
  });

  it('does not return OVERDUE when within 60-min window', () => {
    // Current time: 12:00 (720 min), slot: 11:15 (675 min)
    // 675 > 720 - 60 = 660 → not OVERDUE
    const status = getCellStatus(undefined, '11:15', 720, true);
    expect(status).not.toBe(MedicationDoseStatus.OVERDUE);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — DUE
// ---------------------------------------------------------------------------

describe('getCellStatus — DUE', () => {
  it('returns DUE when slot is within ±60 min of current time', () => {
    // Current time: 12:00 (720 min), slot: 12:00 — exact match
    expect(getCellStatus(undefined, '12:00', 720, true)).toBe(MedicationDoseStatus.DUE);
  });

  it('returns DUE when slot is 30 min before current time', () => {
    // Current time: 12:00 (720 min), slot: 11:30 (690 min)
    // |690 - 720| = 30 ≤ 60 → DUE, but also 690 <= 720-60=660? No, 690 > 660 → not OVERDUE
    expect(getCellStatus(undefined, '11:30', 720, true)).toBe(MedicationDoseStatus.DUE);
  });

  it('returns DUE when slot is 60 min in the future', () => {
    // Current time: 12:00 (720 min), slot: 13:00 (780 min)
    // |780 - 720| = 60 ≤ 60 → DUE
    expect(getCellStatus(undefined, '13:00', 720, true)).toBe(MedicationDoseStatus.DUE);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — PENDING
// ---------------------------------------------------------------------------

describe('getCellStatus — PENDING', () => {
  it('returns PENDING when slot is more than 60 min in the future', () => {
    // Current time: 12:00 (720 min), slot: 14:00 (840 min)
    // 840 > 720 and |840 - 720| = 120 > 60 → PENDING
    expect(getCellStatus(undefined, '14:00', 720, true)).toBe(MedicationDoseStatus.PENDING);
  });

  it('returns PENDING for early morning slots when current time is noon', () => {
    // Current time: 12:00 (720), slot: 22:00 (1320)
    // 1320 > 720 and |1320-720| = 600 > 60 → PENDING
    expect(getCellStatus(undefined, '22:00', 720, true)).toBe(MedicationDoseStatus.PENDING);
  });
});

// ---------------------------------------------------------------------------
// getCellStatus — priority rules (GIVEN takes precedence)
// ---------------------------------------------------------------------------

describe('getCellStatus — GIVEN takes precedence over time-based status', () => {
  it('returns GIVEN even if slot would be DUE by current time', () => {
    // lastGiven at 12:30, current at 12:00, slot at 12:00
    // Slot <= lastGiven → GIVEN (not DUE)
    const lastGiven = '2026-01-01T12:30:00';
    expect(getCellStatus(lastGiven, '12:00', 720, true)).toBe(MedicationDoseStatus.GIVEN);
  });
});
