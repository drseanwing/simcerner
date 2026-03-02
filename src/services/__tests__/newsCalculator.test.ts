import { describe, it, expect } from 'vitest';
import {
  calculateQADDS,
  calculateSubScore,
  getQADDSRiskLevel,
  getEscalationRecommendation,
  getObservationFrequency,
  // Backward-compatible aliases
  calculateNEWS2,
  getClinicalRisk,
} from '../newsCalculator';
import type { VitalSign } from '../../types/patient';

// ---------------------------------------------------------------------------
// Helper: build a VitalSign with sensible defaults (all normal)
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
    o2FlowRate: 0,
    ...overrides,
  };
}

// ===========================================================================
// 1. calculateSubScore -- All 7 parameters with boundary values
// ===========================================================================

describe('calculateSubScore', () => {
  // -------------------------------------------------------------------------
  // Respiratory Rate
  // -------------------------------------------------------------------------
  describe('Respiratory Rate', () => {
    it('returns E for RR <= 8', () => {
      expect(calculateSubScore('respiratoryRate', 8)).toBe('E');
      expect(calculateSubScore('respiratoryRate', 5)).toBe('E');
    });

    it('scores 1 for RR 9-12', () => {
      expect(calculateSubScore('respiratoryRate', 9)).toBe(1);
      expect(calculateSubScore('respiratoryRate', 12)).toBe(1);
    });

    it('scores 0 for RR 13-20', () => {
      expect(calculateSubScore('respiratoryRate', 13)).toBe(0);
      expect(calculateSubScore('respiratoryRate', 16)).toBe(0);
      expect(calculateSubScore('respiratoryRate', 20)).toBe(0);
    });

    it('scores 1 for RR 21-24', () => {
      expect(calculateSubScore('respiratoryRate', 21)).toBe(1);
      expect(calculateSubScore('respiratoryRate', 24)).toBe(1);
    });

    it('scores 2 for RR 25-30', () => {
      expect(calculateSubScore('respiratoryRate', 25)).toBe(2);
      expect(calculateSubScore('respiratoryRate', 30)).toBe(2);
    });

    it('scores 4 for RR 31-35', () => {
      expect(calculateSubScore('respiratoryRate', 31)).toBe(4);
      expect(calculateSubScore('respiratoryRate', 35)).toBe(4);
    });

    it('returns E for RR >= 36', () => {
      expect(calculateSubScore('respiratoryRate', 36)).toBe('E');
      expect(calculateSubScore('respiratoryRate', 40)).toBe('E');
    });
  });

  // -------------------------------------------------------------------------
  // SpO2 Standard
  // -------------------------------------------------------------------------
  describe('SpO2 Standard', () => {
    it('scores 4 for SpO2 <= 84', () => {
      expect(calculateSubScore('spo2Standard', 84)).toBe(4);
      expect(calculateSubScore('spo2Standard', 80)).toBe(4);
    });

    it('scores 2 for SpO2 85-89', () => {
      expect(calculateSubScore('spo2Standard', 85)).toBe(2);
      expect(calculateSubScore('spo2Standard', 89)).toBe(2);
    });

    it('scores 1 for SpO2 90-91', () => {
      expect(calculateSubScore('spo2Standard', 90)).toBe(1);
      expect(calculateSubScore('spo2Standard', 91)).toBe(1);
    });

    it('scores 0 for SpO2 >= 92', () => {
      expect(calculateSubScore('spo2Standard', 92)).toBe(0);
      expect(calculateSubScore('spo2Standard', 98)).toBe(0);
      expect(calculateSubScore('spo2Standard', 100)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // O2 Delivery (flow rate L/min)
  // -------------------------------------------------------------------------
  describe('O2 Delivery', () => {
    it('scores 0 for flow rate < 2', () => {
      expect(calculateSubScore('o2Delivery', 0)).toBe(0);
      expect(calculateSubScore('o2Delivery', 1)).toBe(0);
    });

    it('scores 1 for flow rate 2-5', () => {
      expect(calculateSubScore('o2Delivery', 2)).toBe(1);
      expect(calculateSubScore('o2Delivery', 5)).toBe(1);
    });

    it('scores 2 for flow rate 6-11', () => {
      expect(calculateSubScore('o2Delivery', 6)).toBe(2);
      expect(calculateSubScore('o2Delivery', 11)).toBe(2);
    });

    it('scores 4 for flow rate 12-14', () => {
      expect(calculateSubScore('o2Delivery', 12)).toBe(4);
      expect(calculateSubScore('o2Delivery', 14)).toBe(4);
    });

    it('returns E for flow rate >= 15', () => {
      expect(calculateSubScore('o2Delivery', 15)).toBe('E');
      expect(calculateSubScore('o2Delivery', 20)).toBe('E');
    });
  });

  // -------------------------------------------------------------------------
  // Systolic Blood Pressure
  // -------------------------------------------------------------------------
  describe('Systolic BP', () => {
    it('returns E for BP <= 79', () => {
      expect(calculateSubScore('systolicBP', 59)).toBe('E');
      expect(calculateSubScore('systolicBP', 60)).toBe('E');
      expect(calculateSubScore('systolicBP', 79)).toBe('E');
    });

    it('scores 4 for BP 80-89', () => {
      expect(calculateSubScore('systolicBP', 80)).toBe(4);
      expect(calculateSubScore('systolicBP', 89)).toBe(4);
    });

    it('scores 2 for BP 90-99', () => {
      expect(calculateSubScore('systolicBP', 90)).toBe(2);
      expect(calculateSubScore('systolicBP', 99)).toBe(2);
    });

    it('scores 1 for BP 100-109', () => {
      expect(calculateSubScore('systolicBP', 100)).toBe(1);
      expect(calculateSubScore('systolicBP', 109)).toBe(1);
    });

    it('scores 0 for BP 110-159', () => {
      expect(calculateSubScore('systolicBP', 110)).toBe(0);
      expect(calculateSubScore('systolicBP', 140)).toBe(0);
      expect(calculateSubScore('systolicBP', 159)).toBe(0);
    });

    it('scores 1 for BP 160-169', () => {
      expect(calculateSubScore('systolicBP', 160)).toBe(1);
      expect(calculateSubScore('systolicBP', 169)).toBe(1);
    });

    it('scores 2 for BP 170-199', () => {
      expect(calculateSubScore('systolicBP', 170)).toBe(2);
      expect(calculateSubScore('systolicBP', 199)).toBe(2);
    });

    it('scores 4 for BP >= 200', () => {
      expect(calculateSubScore('systolicBP', 200)).toBe(4);
      expect(calculateSubScore('systolicBP', 250)).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Heart Rate
  // -------------------------------------------------------------------------
  describe('Heart Rate', () => {
    it('returns E for HR <= 39', () => {
      expect(calculateSubScore('heartRate', 39)).toBe('E');
      expect(calculateSubScore('heartRate', 30)).toBe('E');
    });

    it('scores 2 for HR 40-49', () => {
      expect(calculateSubScore('heartRate', 40)).toBe(2);
      expect(calculateSubScore('heartRate', 49)).toBe(2);
    });

    it('scores 0 for HR 50-99', () => {
      expect(calculateSubScore('heartRate', 50)).toBe(0);
      expect(calculateSubScore('heartRate', 75)).toBe(0);
      expect(calculateSubScore('heartRate', 99)).toBe(0);
    });

    it('scores 1 for HR 100-109', () => {
      expect(calculateSubScore('heartRate', 100)).toBe(1);
      expect(calculateSubScore('heartRate', 109)).toBe(1);
    });

    it('scores 2 for HR 110-129', () => {
      expect(calculateSubScore('heartRate', 110)).toBe(2);
      expect(calculateSubScore('heartRate', 129)).toBe(2);
    });

    it('scores 3 for HR 130-139', () => {
      expect(calculateSubScore('heartRate', 130)).toBe(3);
      expect(calculateSubScore('heartRate', 139)).toBe(3);
    });

    it('scores 4 for HR 140-159', () => {
      expect(calculateSubScore('heartRate', 140)).toBe(4);
      expect(calculateSubScore('heartRate', 159)).toBe(4);
    });

    it('returns E for HR >= 160', () => {
      expect(calculateSubScore('heartRate', 160)).toBe('E');
      expect(calculateSubScore('heartRate', 200)).toBe('E');
    });
  });

  // -------------------------------------------------------------------------
  // Temperature
  // -------------------------------------------------------------------------
  describe('Temperature', () => {
    it('scores 4 for temp <= 34.0', () => {
      expect(calculateSubScore('temperature', 34.0)).toBe(4);
      expect(calculateSubScore('temperature', 33.0)).toBe(4);
    });

    it('scores 2 for temp 34.1-35.0', () => {
      expect(calculateSubScore('temperature', 34.1)).toBe(2);
      expect(calculateSubScore('temperature', 35.0)).toBe(2);
    });

    it('scores 1 for temp 35.1-36.0', () => {
      expect(calculateSubScore('temperature', 35.1)).toBe(1);
      expect(calculateSubScore('temperature', 36.0)).toBe(1);
    });

    it('scores 0 for temp 36.1-37.9', () => {
      expect(calculateSubScore('temperature', 36.1)).toBe(0);
      expect(calculateSubScore('temperature', 37.0)).toBe(0);
      expect(calculateSubScore('temperature', 37.9)).toBe(0);
    });

    it('scores 1 for temp 38.0-38.4', () => {
      expect(calculateSubScore('temperature', 38.0)).toBe(1);
      expect(calculateSubScore('temperature', 38.4)).toBe(1);
    });

    it('scores 2 for temp 38.5-39.4', () => {
      expect(calculateSubScore('temperature', 38.5)).toBe(2);
      expect(calculateSubScore('temperature', 39.4)).toBe(2);
    });

    it('scores 2 for temp >= 39.5', () => {
      expect(calculateSubScore('temperature', 39.5)).toBe(2);
      expect(calculateSubScore('temperature', 41.0)).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Consciousness (via AVPU numeric mapping)
  // -------------------------------------------------------------------------
  describe('Consciousness', () => {
    it('scores 0 for Alert (numeric 0)', () => {
      expect(calculateSubScore('consciousness', 0)).toBe(0);
    });

    it('scores 1 for Voice (numeric 1)', () => {
      expect(calculateSubScore('consciousness', 1)).toBe(1);
    });

    it('scores 4 for Confusion (numeric 4)', () => {
      expect(calculateSubScore('consciousness', 4)).toBe(4);
    });

    it('returns E for Pain (numeric 5)', () => {
      expect(calculateSubScore('consciousness', 5)).toBe('E');
    });

    it('returns E for Unresponsive (numeric 6)', () => {
      expect(calculateSubScore('consciousness', 6)).toBe('E');
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns 0 for unknown parameter', () => {
      expect(calculateSubScore('nonExistentParam', 42)).toBe(0);
    });
  });
});

// ===========================================================================
// 2. calculateQADDS -- Aggregate scoring
// ===========================================================================

describe('calculateQADDS', () => {
  it('calculates totalScore 0, riskLevel Normal, escalationLevel 0 for normal vitals', () => {
    const result = calculateQADDS(makeVital());
    expect(result.totalScore).toBe(0);
    expect(result.riskLevel).toBe('Normal');
    expect(result.escalationLevel).toBe(0);
  });

  it('includes all 7 sub-scores for complete vitals', () => {
    const result = calculateQADDS(makeVital());
    expect(result.subScores).toHaveLength(7);
    const params = result.subScores.map((s) => s.parameter);
    expect(params).toContain('Respiratory Rate');
    expect(params).toContain('SpO2');
    expect(params).toContain('O2 Delivery');
    expect(params).toContain('Systolic BP');
    expect(params).toContain('Heart Rate');
    expect(params).toContain('Temperature');
    expect(params).toContain('Consciousness');
  });

  it('handles missing vitals gracefully (partial charting)', () => {
    const result = calculateQADDS({
      datetime: '2026-02-17T08:00:00',
      // No vitals provided at all -- only O2 Delivery defaults to 0
    });
    // O2 Delivery is always included (defaults to 0 flow rate)
    expect(result.subScores).toHaveLength(1);
    expect(result.subScores[0].parameter).toBe('O2 Delivery');
    expect(result.totalScore).toBe(0);
  });

  it('detects E-zone: HR=35 -> hasEZone=true, eZoneParameters includes Heart Rate', () => {
    const result = calculateQADDS(makeVital({ hr: 35 }));
    expect(result.hasEZone).toBe(true);
    expect(result.eZoneParameters).toContain('Heart Rate');
    expect(result.riskLevel).toBe('MET');
  });

  it('E-zone does NOT add to totalScore (numeric sum only)', () => {
    // HR=35 is E-zone, all other vitals normal (score 0 each)
    const result = calculateQADDS(makeVital({ hr: 35 }));
    // E contributes 0 to numeric sum; all other params are normal = 0
    expect(result.totalScore).toBe(0);
    expect(result.hasEZone).toBe(true);
  });

  it('detects multiple E-zones simultaneously', () => {
    const result = calculateQADDS(
      makeVital({
        hr: 30,     // E zone (HR <= 39)
        rr: 5,      // E zone (RR <= 8)
        bp_sys: 50,  // E zone (BP <= 79)
      }),
    );
    expect(result.hasEZone).toBe(true);
    expect(result.eZoneParameters).toContain('Heart Rate');
    expect(result.eZoneParameters).toContain('Respiratory Rate');
    expect(result.eZoneParameters).toContain('Systolic BP');
    expect(result.eZoneParameters).toHaveLength(3);
    expect(result.totalScore).toBe(0); // E zones contribute 0
    expect(result.riskLevel).toBe('MET');
  });

  it('high score scenario: totalScore >= 8 -> riskLevel MET', () => {
    const result = calculateQADDS(
      makeVital({
        temp: 33.0,  // 4
        hr: 140,     // 4
        bp_sys: 80,  // 4
        // rr=16 (0), spo2=98 (0), o2FlowRate=0 (0), avpu=A (0)
      }),
    );
    expect(result.totalScore).toBe(12);
    expect(result.riskLevel).toBe('MET');
    expect(result.escalationLevel).toBe(4);
  });

  it('o2FlowRate=10 scores 2 for O2 Delivery', () => {
    const result = calculateQADDS(makeVital({ o2FlowRate: 10 }));
    const o2Sub = result.subScores.find((s) => s.parameter === 'O2 Delivery');
    expect(o2Sub).toBeDefined();
    expect(o2Sub!.value).toBe(10);
    expect(o2Sub!.score).toBe(2);
  });
});

// ===========================================================================
// 3. getQADDSRiskLevel
// ===========================================================================

describe('getQADDSRiskLevel', () => {
  it('returns Normal for score 0, no E-zone', () => {
    expect(getQADDSRiskLevel(0, false)).toBe('Normal');
  });

  it('returns Low for score 1-3, no E-zone', () => {
    expect(getQADDSRiskLevel(1, false)).toBe('Low');
    expect(getQADDSRiskLevel(2, false)).toBe('Low');
    expect(getQADDSRiskLevel(3, false)).toBe('Low');
  });

  it('returns Moderate for score 4-5, no E-zone', () => {
    expect(getQADDSRiskLevel(4, false)).toBe('Moderate');
    expect(getQADDSRiskLevel(5, false)).toBe('Moderate');
  });

  it('returns High for score 6-7, no E-zone', () => {
    expect(getQADDSRiskLevel(6, false)).toBe('High');
    expect(getQADDSRiskLevel(7, false)).toBe('High');
  });

  it('returns MET for score >= 8, no E-zone', () => {
    expect(getQADDSRiskLevel(8, false)).toBe('MET');
    expect(getQADDSRiskLevel(12, false)).toBe('MET');
    expect(getQADDSRiskLevel(20, false)).toBe('MET');
  });

  it('returns MET for any score when E-zone is present', () => {
    expect(getQADDSRiskLevel(0, true)).toBe('MET');
    expect(getQADDSRiskLevel(3, true)).toBe('MET');
    expect(getQADDSRiskLevel(5, true)).toBe('MET');
    expect(getQADDSRiskLevel(7, true)).toBe('MET');
  });
});

// ===========================================================================
// 4. getEscalationRecommendation
// ===========================================================================

describe('getEscalationRecommendation', () => {
  it('Normal -> contains "routine" and "8-hourly"', () => {
    const rec = getEscalationRecommendation('Normal');
    expect(rec).toContain('routine');
    expect(rec).toContain('8-hourly');
  });

  it('Low -> contains "Team Leader" and "4-hourly"', () => {
    const rec = getEscalationRecommendation('Low');
    expect(rec).toContain('Team Leader');
    expect(rec).toContain('4-hourly');
  });

  it('Moderate -> contains "RMO" and "30 min"', () => {
    const rec = getEscalationRecommendation('Moderate');
    expect(rec).toContain('RMO');
    expect(rec).toContain('30 min');
  });

  it('High -> contains "Registrar" and "30 min"', () => {
    const rec = getEscalationRecommendation('High');
    expect(rec).toContain('Registrar');
    expect(rec).toContain('30 min');
  });

  it('MET -> contains "MET Call" and "10-minutely"', () => {
    const rec = getEscalationRecommendation('MET');
    expect(rec).toContain('MET Call');
    expect(rec).toContain('10-minutely');
  });
});

// ===========================================================================
// 5. getObservationFrequency
// ===========================================================================

describe('getObservationFrequency', () => {
  it('Normal, stable -> 8-hourly', () => {
    expect(getObservationFrequency('Normal', false)).toBe('8-hourly');
  });

  it('Low, deteriorating -> 1-hourly', () => {
    expect(getObservationFrequency('Low', true)).toBe('1-hourly');
  });

  it('Low, stable -> 4-hourly', () => {
    expect(getObservationFrequency('Low', false)).toBe('4-hourly');
  });

  it('Moderate, deteriorating -> 1-hourly', () => {
    expect(getObservationFrequency('Moderate', true)).toBe('1-hourly');
  });

  it('Moderate, stable -> 2-hourly', () => {
    expect(getObservationFrequency('Moderate', false)).toBe('2-hourly');
  });

  it('High, deteriorating -> Half-hourly', () => {
    expect(getObservationFrequency('High', true)).toBe('Half-hourly');
  });

  it('High, stable -> 1-hourly', () => {
    expect(getObservationFrequency('High', false)).toBe('1-hourly');
  });

  it('MET, deteriorating -> 10-minutely', () => {
    expect(getObservationFrequency('MET', true)).toBe('10-minutely');
  });

  it('MET, stable -> 10-minutely', () => {
    expect(getObservationFrequency('MET', false)).toBe('10-minutely');
  });
});

// ===========================================================================
// 6. Backward compatibility
// ===========================================================================

describe('backward compatibility', () => {
  it('calculateNEWS2 is exported and works as alias for calculateQADDS', () => {
    const vital = makeVital();
    const qaddsResult = calculateQADDS(vital);
    const news2Result = calculateNEWS2(vital);
    expect(news2Result).toEqual(qaddsResult);
  });

  it('getClinicalRisk is exported and works as alias for getQADDSRiskLevel', () => {
    expect(getClinicalRisk(0, false)).toBe('Normal');
    expect(getClinicalRisk(3, false)).toBe('Low');
    expect(getClinicalRisk(4, false)).toBe('Moderate');
    expect(getClinicalRisk(7, false)).toBe('High');
    expect(getClinicalRisk(8, false)).toBe('MET');
    expect(getClinicalRisk(0, true)).toBe('MET');
  });
});
