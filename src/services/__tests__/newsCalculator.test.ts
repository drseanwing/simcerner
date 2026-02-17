import { describe, it, expect } from 'vitest';
import {
  calculateNEWS2,
  calculateSubScore,
  getClinicalRisk,
  getEscalationRecommendation,
} from '../newsCalculator';
import type { VitalSign } from '../../types/patient';

// ---------------------------------------------------------------------------
// Helper: build a VitalSign with defaults
// ---------------------------------------------------------------------------

function makeVital(overrides: Partial<VitalSign> = {}): VitalSign {
  return {
    datetime: '2026-02-17T08:00:00',
    temp: 37.0,
    hr: 75,
    rr: 16,
    bp_sys: 120,
    spo2: 98,
    avpu: 'A',
    supplementalO2: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Individual parameter scoring
// ---------------------------------------------------------------------------

describe('calculateSubScore', () => {
  describe('Respiratory Rate', () => {
    it('scores 3 for RR <= 8', () => {
      expect(calculateSubScore('respiratoryRate', 8)).toBe(3);
      expect(calculateSubScore('respiratoryRate', 5)).toBe(3);
    });

    it('scores 1 for RR 9-11', () => {
      expect(calculateSubScore('respiratoryRate', 9)).toBe(1);
      expect(calculateSubScore('respiratoryRate', 11)).toBe(1);
    });

    it('scores 0 for RR 12-20', () => {
      expect(calculateSubScore('respiratoryRate', 12)).toBe(0);
      expect(calculateSubScore('respiratoryRate', 16)).toBe(0);
      expect(calculateSubScore('respiratoryRate', 20)).toBe(0);
    });

    it('scores 2 for RR 21-24', () => {
      expect(calculateSubScore('respiratoryRate', 21)).toBe(2);
      expect(calculateSubScore('respiratoryRate', 24)).toBe(2);
    });

    it('scores 3 for RR >= 25', () => {
      expect(calculateSubScore('respiratoryRate', 25)).toBe(3);
      expect(calculateSubScore('respiratoryRate', 40)).toBe(3);
    });
  });

  describe('SpO2 Scale 1', () => {
    it('scores 3 for SpO2 <= 91', () => {
      expect(calculateSubScore('spo2Scale1', 91)).toBe(3);
      expect(calculateSubScore('spo2Scale1', 85)).toBe(3);
    });

    it('scores 2 for SpO2 92-93', () => {
      expect(calculateSubScore('spo2Scale1', 92)).toBe(2);
      expect(calculateSubScore('spo2Scale1', 93)).toBe(2);
    });

    it('scores 1 for SpO2 94-95', () => {
      expect(calculateSubScore('spo2Scale1', 94)).toBe(1);
      expect(calculateSubScore('spo2Scale1', 95)).toBe(1);
    });

    it('scores 0 for SpO2 >= 96', () => {
      expect(calculateSubScore('spo2Scale1', 96)).toBe(0);
      expect(calculateSubScore('spo2Scale1', 100)).toBe(0);
    });
  });

  describe('Temperature', () => {
    it('scores 3 for temp <= 35.0', () => {
      expect(calculateSubScore('temperature', 35.0)).toBe(3);
      expect(calculateSubScore('temperature', 34.0)).toBe(3);
    });

    it('scores 1 for temp 35.1-36.0', () => {
      expect(calculateSubScore('temperature', 35.1)).toBe(1);
      expect(calculateSubScore('temperature', 36.0)).toBe(1);
    });

    it('scores 0 for temp 36.1-38.0', () => {
      expect(calculateSubScore('temperature', 36.1)).toBe(0);
      expect(calculateSubScore('temperature', 37.0)).toBe(0);
      expect(calculateSubScore('temperature', 38.0)).toBe(0);
    });

    it('scores 1 for temp 38.1-39.0', () => {
      expect(calculateSubScore('temperature', 38.1)).toBe(1);
      expect(calculateSubScore('temperature', 39.0)).toBe(1);
    });

    it('scores 2 for temp >= 39.1', () => {
      expect(calculateSubScore('temperature', 39.1)).toBe(2);
      expect(calculateSubScore('temperature', 41.0)).toBe(2);
    });
  });

  describe('Heart Rate', () => {
    it('scores 3 for HR <= 40', () => {
      expect(calculateSubScore('heartRate', 40)).toBe(3);
      expect(calculateSubScore('heartRate', 30)).toBe(3);
    });

    it('scores 1 for HR 41-50', () => {
      expect(calculateSubScore('heartRate', 41)).toBe(1);
      expect(calculateSubScore('heartRate', 50)).toBe(1);
    });

    it('scores 0 for HR 51-90', () => {
      expect(calculateSubScore('heartRate', 51)).toBe(0);
      expect(calculateSubScore('heartRate', 75)).toBe(0);
      expect(calculateSubScore('heartRate', 90)).toBe(0);
    });

    it('scores 1 for HR 91-110', () => {
      expect(calculateSubScore('heartRate', 91)).toBe(1);
      expect(calculateSubScore('heartRate', 110)).toBe(1);
    });

    it('scores 2 for HR 111-130', () => {
      expect(calculateSubScore('heartRate', 111)).toBe(2);
      expect(calculateSubScore('heartRate', 130)).toBe(2);
    });

    it('scores 3 for HR >= 131', () => {
      expect(calculateSubScore('heartRate', 131)).toBe(3);
      expect(calculateSubScore('heartRate', 200)).toBe(3);
    });
  });

  describe('Systolic BP', () => {
    it('scores 3 for BP <= 90', () => {
      expect(calculateSubScore('systolicBP', 90)).toBe(3);
      expect(calculateSubScore('systolicBP', 60)).toBe(3);
    });

    it('scores 2 for BP 91-100', () => {
      expect(calculateSubScore('systolicBP', 91)).toBe(2);
      expect(calculateSubScore('systolicBP', 100)).toBe(2);
    });

    it('scores 1 for BP 101-110', () => {
      expect(calculateSubScore('systolicBP', 101)).toBe(1);
      expect(calculateSubScore('systolicBP', 110)).toBe(1);
    });

    it('scores 0 for BP 111-219', () => {
      expect(calculateSubScore('systolicBP', 111)).toBe(0);
      expect(calculateSubScore('systolicBP', 120)).toBe(0);
      expect(calculateSubScore('systolicBP', 219)).toBe(0);
    });

    it('scores 3 for BP >= 220', () => {
      expect(calculateSubScore('systolicBP', 220)).toBe(3);
      expect(calculateSubScore('systolicBP', 280)).toBe(3);
    });
  });

  describe('Supplemental O2', () => {
    it('scores 0 when not on supplemental O2', () => {
      expect(calculateSubScore('supplementalO2', 0)).toBe(0);
    });

    it('scores 2 when on supplemental O2', () => {
      expect(calculateSubScore('supplementalO2', 1)).toBe(2);
    });
  });

  describe('Consciousness (AVPU)', () => {
    it('scores 0 for Alert (numeric 0)', () => {
      expect(calculateSubScore('consciousness', 0)).toBe(0);
    });

    it('scores 3 for non-Alert states (numeric 1-3)', () => {
      expect(calculateSubScore('consciousness', 1)).toBe(3);
      expect(calculateSubScore('consciousness', 2)).toBe(3);
      expect(calculateSubScore('consciousness', 3)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for unknown parameter', () => {
      expect(calculateSubScore('nonExistentParam', 42)).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Aggregate scoring
// ---------------------------------------------------------------------------

describe('calculateNEWS2', () => {
  it('calculates total score of 0 for normal vitals', () => {
    const result = calculateNEWS2(makeVital());
    expect(result.totalScore).toBe(0);
    expect(result.clinicalRisk).toBe('Low');
    expect(result.escalationLevel).toBe(0);
  });

  it('includes all 7 sub-scores for complete vitals', () => {
    const result = calculateNEWS2(makeVital());
    expect(result.subScores).toHaveLength(7);
    const params = result.subScores.map((s) => s.parameter);
    expect(params).toContain('Respiratory Rate');
    expect(params).toContain('SpO2');
    expect(params).toContain('Supplemental O2');
    expect(params).toContain('Temperature');
    expect(params).toContain('Systolic BP');
    expect(params).toContain('Heart Rate');
    expect(params).toContain('Consciousness');
  });

  it('handles missing vitals gracefully', () => {
    const result = calculateNEWS2({
      datetime: '2026-02-17T08:00:00',
      supplementalO2: false,
    });
    // Only supplemental O2 should produce a sub-score
    expect(result.subScores).toHaveLength(1);
    expect(result.totalScore).toBe(0);
  });

  it('calculates High risk for critically abnormal vitals', () => {
    const result = calculateNEWS2(
      makeVital({
        temp: 39.5, // 2
        hr: 135,    // 3
        rr: 26,     // 3
        bp_sys: 85, // 3
        spo2: 90,   // 3
        avpu: 'V',  // 3
        supplementalO2: true, // 2
      }),
    );
    expect(result.totalScore).toBeGreaterThanOrEqual(7);
    expect(result.clinicalRisk).toBe('High');
    expect(result.escalationLevel).toBe(3);
  });

  it('detects Low-Medium risk when a single parameter scores 3 but total < 5', () => {
    const result = calculateNEWS2(
      makeVital({
        rr: 7, // scores 3
        // all others normal = 0
      }),
    );
    expect(result.totalScore).toBe(3);
    expect(result.clinicalRisk).toBe('Low-Medium');
    expect(result.escalationLevel).toBe(1);
  });

  it('calculates Medium risk for total 5-6', () => {
    const result = calculateNEWS2(
      makeVital({
        temp: 38.5,  // 1
        hr: 95,      // 1
        rr: 22,      // 2
        bp_sys: 105, // 1
      }),
    );
    expect(result.totalScore).toBe(5);
    expect(result.clinicalRisk).toBe('Medium');
    expect(result.escalationLevel).toBe(2);
  });

  it('records supplemental O2 as "Yes"/"No" string in sub-score value', () => {
    const onO2 = calculateNEWS2(makeVital({ supplementalO2: true }));
    const o2Sub = onO2.subScores.find((s) => s.parameter === 'Supplemental O2');
    expect(o2Sub?.value).toBe('Yes');
    expect(o2Sub?.score).toBe(2);

    const noO2 = calculateNEWS2(makeVital({ supplementalO2: false }));
    const noO2Sub = noO2.subScores.find((s) => s.parameter === 'Supplemental O2');
    expect(noO2Sub?.value).toBe('No');
    expect(noO2Sub?.score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Clinical risk classification
// ---------------------------------------------------------------------------

describe('getClinicalRisk', () => {
  it('returns Low for score 0-4 with no red score', () => {
    expect(getClinicalRisk(0)).toBe('Low');
    expect(getClinicalRisk(4)).toBe('Low');
  });

  it('returns Low-Medium when hasRedScore is true and total < 5', () => {
    expect(getClinicalRisk(3, true)).toBe('Low-Medium');
    expect(getClinicalRisk(4, true)).toBe('Low-Medium');
  });

  it('returns Medium for score 5-6', () => {
    expect(getClinicalRisk(5)).toBe('Medium');
    expect(getClinicalRisk(6)).toBe('Medium');
  });

  it('returns High for score >= 7', () => {
    expect(getClinicalRisk(7)).toBe('High');
    expect(getClinicalRisk(12)).toBe('High');
    expect(getClinicalRisk(20)).toBe('High');
  });

  it('returns High for score >= 7 even with no red score', () => {
    expect(getClinicalRisk(7, false)).toBe('High');
  });

  it('returns Medium for score 5 with red score (High takes precedence only at >= 7)', () => {
    expect(getClinicalRisk(5, true)).toBe('Medium');
  });
});

// ---------------------------------------------------------------------------
// Escalation recommendations
// ---------------------------------------------------------------------------

describe('getEscalationRecommendation', () => {
  it('returns routine monitoring for Low risk', () => {
    const rec = getEscalationRecommendation('Low');
    expect(rec).toContain('routine monitoring');
  });

  it('returns increased observation for Low-Medium risk', () => {
    const rec = getEscalationRecommendation('Low-Medium');
    expect(rec).toContain('1-hourly');
  });

  it('returns urgent review for Medium risk', () => {
    const rec = getEscalationRecommendation('Medium');
    expect(rec).toContain('Urgent');
  });

  it('returns emergency response for High risk', () => {
    const rec = getEscalationRecommendation('High');
    expect(rec).toContain('Emergency');
    expect(rec).toContain('critical care');
  });
});
