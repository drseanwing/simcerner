/**
 * Q-ADDS Calculator Tests
 *
 * Validates all 7 parameter scoring tables against the official Queensland Health
 * Q-ADDS observation charts: SW150 (General Adult v10.00), SW626 (Cardiac v4.00),
 * and SW1171 (Chronic Hypoxia/Hypercapnia Respiratory v2.00).
 */

import { describe, it, expect } from 'vitest'
import type { VitalSign } from '@/types/patient'
import {
  calculateQadds,
  calculateQaddsTrend,
  getScoreColor,
  getRiskColor,
  getColorHex,
  getEscalationText,
  validateVitalsComplete,
} from '@/services/qaddsCalculator'

/** Helper: create a baseline VitalSign with all normal values */
function normalVitals(overrides: Partial<VitalSign> = {}): VitalSign {
  return {
    datetime: '01-Jan-2026 08:00',
    temp: '37.0',
    hr: '75',
    rr: '16',
    bp_sys: '120',
    bp_dia: '80',
    spo2: '98',
    avpu: 'Alert',
    o2FlowRate: '0',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Respiratory Rate (RR) — Official: ≤8→E, 9-12→1, 13-20→0, 21-24→1,
//                                    25-30→2, 31-35→4, ≥36→E
// ---------------------------------------------------------------------------
describe('RR scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['RR=4 → E', 4, 'E'],
    ['RR=8 → E', 8, 'E'],
    ['RR=9 → 1', 9, 1],
    ['RR=12 → 1', 12, 1],
    ['RR=13 → 0', 13, 0],
    ['RR=16 → 0', 16, 0],
    ['RR=20 → 0', 20, 0],
    ['RR=21 → 1', 21, 1],
    ['RR=24 → 1', 24, 1],
    ['RR=25 → 2', 25, 2],
    ['RR=30 → 2', 30, 2],
    ['RR=31 → 4', 31, 4],
    ['RR=35 → 4', 35, 4],
    ['RR=36 → E', 36, 'E'],
    ['RR=40 → E', 40, 'E'],
  ]

  it.each(cases)('%s', (_label, rr, expected) => {
    const result = calculateQadds(normalVitals({ rr: String(rr) }))
    expect(result.subScores.rr.score).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// SpO₂ Standard — Official: ≥92→0, 90-91→1, 85-89→2, ≤84→4
//                            No E zone.
// ---------------------------------------------------------------------------
describe('SpO₂ Standard scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['SpO2=99 → 0', 99, 0],
    ['SpO2=98 → 0', 98, 0],
    ['SpO2=95 → 0', 95, 0],
    ['SpO2=92 → 0', 92, 0],
    ['SpO2=91 → 1', 91, 1],
    ['SpO2=90 → 1', 90, 1],
    ['SpO2=89 → 2', 89, 2],
    ['SpO2=85 → 2', 85, 2],
    ['SpO2=84 → 4', 84, 4],
    ['SpO2=80 → 4', 80, 4],
  ]

  it.each(cases)('%s', (_label, spo2, expected) => {
    const result = calculateQadds(normalVitals({ spo2: String(spo2) }), 'standard')
    expect(result.subScores.spo2.score).toBe(expected)
  })

  it('SpO₂ has no E zone', () => {
    const result = calculateQadds(normalVitals({ spo2: '70' }), 'standard')
    expect(result.subScores.spo2.score).toBe(4) // NOT 'E'
  })
})

// ---------------------------------------------------------------------------
// SpO₂ Chronic Respiratory — Official: ≥88→0, 86-87→1, 84-85→2, ≤83→4
// ---------------------------------------------------------------------------
describe('SpO₂ Chronic Respiratory scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['SpO2=95 → 0', 95, 0],
    ['SpO2=88 → 0', 88, 0],
    ['SpO2=87 → 1', 87, 1],
    ['SpO2=86 → 1', 86, 1],
    ['SpO2=85 → 2', 85, 2],
    ['SpO2=84 → 2', 84, 2],
    ['SpO2=83 → 4', 83, 4],
    ['SpO2=75 → 4', 75, 4],
  ]

  it.each(cases)('%s', (_label, spo2, expected) => {
    const result = calculateQadds(normalVitals({ spo2: String(spo2) }), 'chronic_respiratory')
    expect(result.subScores.spo2.score).toBe(expected)
  })

  it('88-92% on supplemental O₂ still scores 0 (no scoring difference)', () => {
    const vitals = normalVitals({ spo2: '90', supplementalO2: true, o2FlowRate: '4' })
    const result = calculateQadds(vitals, 'chronic_respiratory')
    expect(result.subScores.spo2.score).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// O₂ Delivery — Official: <2→0, 2-5→1, >5-11→2, >11-14→4, ≥15→E
// ---------------------------------------------------------------------------
describe('O₂ Delivery scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['O2=0 → 0', 0, 0],
    ['O2=1 → 0', 1, 0],
    ['O2=1.9 → 0', 1.9, 0],
    ['O2=2 → 1', 2, 1],
    ['O2=5 → 1', 5, 1],
    ['O2=5.1 → 2', 5.1, 2],
    ['O2=11 → 2', 11, 2],
    ['O2=11.1 → 4', 11.1, 4],
    ['O2=14 → 4', 14, 4],
    ['O2=15 → E', 15, 'E'],
    ['O2=20 → E', 20, 'E'],
  ]

  it.each(cases)('%s', (_label, o2, expected) => {
    const result = calculateQadds(normalVitals({ o2FlowRate: String(o2) }))
    expect(result.subScores.o2FlowRate.score).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Systolic BP — Official: ≤79→E, 80-89→4, 90-99→2, 100-109→1,
//               110-159→0, 160-169→1, 170-199→2, ≥200→4
// ---------------------------------------------------------------------------
describe('SBP scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['SBP=50 → E', 50, 'E'],
    ['SBP=60 → E', 60, 'E'],
    ['SBP=79 → E', 79, 'E'],
    ['SBP=80 → 4', 80, 4],
    ['SBP=89 → 4', 89, 4],
    ['SBP=90 → 2', 90, 2],
    ['SBP=99 → 2', 99, 2],
    ['SBP=100 → 1', 100, 1],
    ['SBP=109 → 1', 109, 1],
    ['SBP=110 → 0', 110, 0],
    ['SBP=130 → 0', 130, 0],
    ['SBP=159 → 0', 159, 0],
    ['SBP=160 → 1', 160, 1],
    ['SBP=169 → 1', 169, 1],
    ['SBP=170 → 2', 170, 2],
    ['SBP=190 → 2', 190, 2],
    ['SBP=199 → 2', 199, 2],
    ['SBP=200 → 4', 200, 4],
    ['SBP=220 → 4', 220, 4],
  ]

  it.each(cases)('%s', (_label, sbp, expected) => {
    const result = calculateQadds(normalVitals({ bp_sys: String(sbp) }))
    expect(result.subScores.systolicBP.score).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Heart Rate — Official: ≤39→E, 40-49→2, 50-99→0, 100-109→1,
//              110-129→2, 130-139→3, 140-159→4, ≥160→E
// ---------------------------------------------------------------------------
describe('HR scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['HR=25 → E', 25, 'E'],
    ['HR=39 → E', 39, 'E'],
    ['HR=40 → 2', 40, 2],
    ['HR=49 → 2', 49, 2],
    ['HR=50 → 0', 50, 0],
    ['HR=75 → 0', 75, 0],
    ['HR=99 → 0', 99, 0],
    ['HR=100 → 1', 100, 1],
    ['HR=109 → 1', 109, 1],
    ['HR=110 → 2', 110, 2],
    ['HR=129 → 2', 129, 2],
    ['HR=130 → 3', 130, 3],
    ['HR=139 → 3', 139, 3],
    ['HR=140 → 4', 140, 4],
    ['HR=159 → 4', 159, 4],
    ['HR=160 → E', 160, 'E'],
    ['HR=180 → E', 180, 'E'],
  ]

  it.each(cases)('%s', (_label, hr, expected) => {
    const result = calculateQadds(normalVitals({ hr: String(hr) }))
    expect(result.subScores.heartRate.score).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Temperature — Official: ≤34→4, 34.1-35→2, 35.1-36→1, 36.1-37.9→0,
//               38-38.4→1, 38.5-39.4→2, ≥39.5→2
//               No E zone.
// ---------------------------------------------------------------------------
describe('Temperature scoring', () => {
  const cases: [string, number, number | 'E'][] = [
    ['Temp=33.0 → 4', 33.0, 4],
    ['Temp=34.0 → 4', 34.0, 4],
    ['Temp=34.1 → 2', 34.1, 2],
    ['Temp=35.0 → 2', 35.0, 2],
    ['Temp=35.1 → 1', 35.1, 1],
    ['Temp=36.0 → 1', 36.0, 1],
    ['Temp=36.1 → 0', 36.1, 0],
    ['Temp=37.0 → 0', 37.0, 0],
    ['Temp=37.9 → 0', 37.9, 0],
    ['Temp=38.0 → 1', 38.0, 1],
    ['Temp=38.4 → 1', 38.4, 1],
    ['Temp=38.5 → 2', 38.5, 2],
    ['Temp=39.4 → 2', 39.4, 2],
    ['Temp=39.5 → 2', 39.5, 2],
    ['Temp=40.0 → 2', 40.0, 2],
  ]

  it.each(cases)('%s', (_label, temp, expected) => {
    const result = calculateQadds(normalVitals({ temp: String(temp) }))
    expect(result.subScores.temperature.score).toBe(expected)
  })

  it('Temperature has no E zone', () => {
    const result = calculateQadds(normalVitals({ temp: '30.0' }))
    expect(result.subScores.temperature.score).toBe(4) // NOT 'E'
  })
})

// ---------------------------------------------------------------------------
// CAVPU — Official: Alert→0, Voice→1, Changing Behaviour→4, Pain→E,
//                    Unresponsive→E
// ---------------------------------------------------------------------------
describe('CAVPU scoring', () => {
  it('Alert → 0', () => {
    const r = calculateQadds(normalVitals({ avpu: 'Alert' }))
    expect(r.subScores.consciousness.score).toBe(0)
  })

  it('Voice → 1', () => {
    const r = calculateQadds(normalVitals({ avpu: 'Voice' }))
    expect(r.subScores.consciousness.score).toBe(1)
  })

  it('Changing Behaviour → 4', () => {
    const r = calculateQadds(normalVitals({ avpu: 'Changing Behaviour' }))
    expect(r.subScores.consciousness.score).toBe(4)
  })

  it('Pain → E (emergency)', () => {
    const r = calculateQadds(normalVitals({ avpu: 'Pain' }))
    expect(r.subScores.consciousness.score).toBe('E')
    expect(r.hasEmergency).toBe(true)
    expect(r.emergencyParameters).toContain('consciousness')
  })

  it('Unresponsive → E (emergency)', () => {
    const r = calculateQadds(normalVitals({ avpu: 'Unresponsive' }))
    expect(r.subScores.consciousness.score).toBe('E')
    expect(r.hasEmergency).toBe(true)
  })

  it('Single-letter abbreviations work', () => {
    expect(calculateQadds(normalVitals({ avpu: 'A' })).subScores.consciousness.score).toBe(0)
    expect(calculateQadds(normalVitals({ avpu: 'V' })).subScores.consciousness.score).toBe(1)
    expect(calculateQadds(normalVitals({ avpu: 'C' })).subScores.consciousness.score).toBe(4)
    expect(calculateQadds(normalVitals({ avpu: 'P' })).subScores.consciousness.score).toBe('E')
    expect(calculateQadds(normalVitals({ avpu: 'U' })).subScores.consciousness.score).toBe('E')
  })
})

// ---------------------------------------------------------------------------
// Risk Level Derivation
// ---------------------------------------------------------------------------
describe('Risk derivation', () => {
  it('Score 0 → Routine', () => {
    const r = calculateQadds(normalVitals())
    expect(r.totalScore).toBe(0)
    expect(r.clinicalRisk).toBe('Routine')
  })

  it('Score 1-3 → Low', () => {
    // RR=9 scores 1
    const r = calculateQadds(normalVitals({ rr: '9' }))
    expect(r.clinicalRisk).toBe('Low')
  })

  it('Score 4-5 → Moderate', () => {
    // RR=31 scores 4
    const r = calculateQadds(normalVitals({ rr: '31' }))
    expect(r.totalScore).toBe(4)
    expect(r.clinicalRisk).toBe('Moderate')
  })

  it('Score 6-7 → High', () => {
    // RR=31 (4) + HR=100 (1) + Temp=38 (1) = 6
    const r = calculateQadds(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
    expect(r.totalScore).toBe(6)
    expect(r.clinicalRisk).toBe('High')
  })

  it('Score ≥8 → Emergency', () => {
    // Temp=33 (4) + SBP=80 (4) = 8
    const r = calculateQadds(normalVitals({ temp: '33.0', bp_sys: '80' }))
    expect(r.totalScore).toBe(8)
    expect(r.clinicalRisk).toBe('Emergency')
  })

  it('Any E parameter → Emergency regardless of total', () => {
    // RR=5 → E, everything else normal (total would be low)
    const r = calculateQadds(normalVitals({ rr: '5' }))
    expect(r.hasEmergency).toBe(true)
    expect(r.clinicalRisk).toBe('Emergency')
  })

  it('Nurse concern → Emergency', () => {
    const r = calculateQadds(normalVitals({ nurseConcern: true }))
    expect(r.hasEmergency).toBe(true)
    expect(r.clinicalRisk).toBe('Emergency')
  })
})

// ---------------------------------------------------------------------------
// Total Score Aggregation
// ---------------------------------------------------------------------------
describe('Total score aggregation', () => {
  it('All normal vitals → total 0', () => {
    const r = calculateQadds(normalVitals())
    expect(r.totalScore).toBe(0)
  })

  it('E values count as 4 in total', () => {
    // Pain → E (counts as 4 in aggregate)
    const r = calculateQadds(normalVitals({ avpu: 'Pain' }))
    expect(r.subScores.consciousness.score).toBe('E')
    expect(r.totalScore).toBe(4)
  })

  it('Multiple abnormal params sum correctly', () => {
    // RR=9(1) + HR=110(2) + Temp=38.5(2) = 5
    const r = calculateQadds(normalVitals({ rr: '9', hr: '110', temp: '38.5' }))
    expect(r.totalScore).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Emergency Parameter Tracking
// ---------------------------------------------------------------------------
describe('Emergency parameter tracking', () => {
  it('No E params → empty array', () => {
    const r = calculateQadds(normalVitals())
    expect(r.emergencyParameters).toEqual([])
    expect(r.hasEmergency).toBe(false)
  })

  it('Multiple E params tracked', () => {
    // RR=5 → E, HR=160 → E
    const r = calculateQadds(normalVitals({ rr: '5', hr: '160' }))
    expect(r.emergencyParameters).toContain('rr')
    expect(r.emergencyParameters).toContain('heartRate')
    expect(r.emergencyParameters.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Trend Calculation
// ---------------------------------------------------------------------------
describe('calculateQaddsTrend', () => {
  it('Returns one entry per vital sign set', () => {
    const vitals = [
      normalVitals({ datetime: '01-Jan-2026 08:00' }),
      normalVitals({ datetime: '01-Jan-2026 12:00', rr: '22' }),
    ]
    const trend = calculateQaddsTrend(vitals)
    expect(trend).toHaveLength(2)
    expect(trend[0].datetime).toBe('01-Jan-2026 08:00')
    expect(trend[1].datetime).toBe('01-Jan-2026 12:00')
    expect(trend[0].score.totalScore).toBe(0)
    expect(trend[1].score.totalScore).toBe(1) // RR=22 → 1
  })
})

// ---------------------------------------------------------------------------
// validateVitalsComplete
// ---------------------------------------------------------------------------
describe('validateVitalsComplete', () => {
  it('Complete vitals → complete=true, missing=[]', () => {
    const r = validateVitalsComplete(normalVitals())
    expect(r.complete).toBe(true)
    expect(r.missing).toEqual([])
  })

  it('Missing RR → incomplete', () => {
    const r = validateVitalsComplete(normalVitals({ rr: '' }))
    expect(r.complete).toBe(false)
    expect(r.missing).toContain('rr')
  })

  it('Missing multiple params reported', () => {
    const r = validateVitalsComplete(normalVitals({ rr: '', spo2: '', avpu: '' }))
    expect(r.complete).toBe(false)
    expect(r.missing).toContain('rr')
    expect(r.missing).toContain('spo2')
    expect(r.missing).toContain('consciousness')
  })
})

// ---------------------------------------------------------------------------
// Colour Mapping Functions
// ---------------------------------------------------------------------------
describe('Colour mappings', () => {
  it('getScoreColor maps all values', () => {
    expect(getScoreColor(0)).toBe('white')
    expect(getScoreColor(1)).toBe('yellow')
    expect(getScoreColor(2)).toBe('orange')
    expect(getScoreColor(3)).toBe('red')
    expect(getScoreColor(4)).toBe('red')
    expect(getScoreColor('E')).toBe('purple')
  })

  it('getRiskColor maps all levels', () => {
    expect(getRiskColor('Routine')).toBe('#ffffff')
    expect(getRiskColor('Low')).toBe('#fff3cd')
    expect(getRiskColor('Moderate')).toBe('#ffd699')
    expect(getRiskColor('High')).toBe('#f8d7da')
    expect(getRiskColor('Emergency')).toBe('#d5a6e6')
  })

  it('getColorHex maps all codes', () => {
    expect(getColorHex('white')).toBe('#ffffff')
    expect(getColorHex('yellow')).toBe('#fff3cd')
    expect(getColorHex('orange')).toBe('#ffd699')
    expect(getColorHex('red')).toBe('#f8d7da')
    expect(getColorHex('purple')).toBe('#d5a6e6')
  })
})

// ---------------------------------------------------------------------------
// Escalation Text
// ---------------------------------------------------------------------------
describe('getEscalationText', () => {
  it('Emergency always returns MET call text', () => {
    const text = getEscalationText('Emergency')
    expect(text).toContain('MET call')
    expect(text).toContain('10 minutely')
  })

  it('Deteriorating vs stable returns different text', () => {
    const det = getEscalationText('Low', 'deteriorating')
    const stab = getEscalationText('Low', 'stable')
    expect(det).toContain('Team Leader')
    expect(det).toContain('1 hourly')
    expect(stab).toContain('4th hourly')
    expect(stab).not.toContain('Team Leader')
  })

  it('Default (no status) includes both pathways', () => {
    const text = getEscalationText('Moderate')
    expect(text).toContain('2nd hourly')
    expect(text).toContain('deteriorating')
  })
})
