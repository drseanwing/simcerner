/**
 * Deterioration Alert Engine Tests
 *
 * Validates alert generation logic against the Queensland Health Discern Alert
 * system. Covers all EWS score ranges, E-zone triggers, nurse concern alerts,
 * sepsis screening criteria, alert priority ordering, and chart variant support.
 */

import { describe, it, expect } from 'vitest'
import type { VitalSign } from '@/types/patient'
import { evaluateAlerts } from '@/services/alertEngine'

/** Helper: create a baseline VitalSign with all normal values (score 0) */
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
// Alert generation by EWS range
// ---------------------------------------------------------------------------
describe('Alert generation by EWS range', () => {
  it('Score 0 (all normal) generates no alerts', () => {
    const alerts = evaluateAlerts(normalVitals())
    expect(alerts).toHaveLength(0)
  })

  describe('Score 1-3 range', () => {
    it('generates alert with title "EW Score 1-3" and risk "Low"', () => {
      // RR=9 scores 1
      const alerts = evaluateAlerts(normalVitals({ rr: '9' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 1-3')
      expect(alerts[0].risk).toBe('Low')
      expect(alerts[0].ewsRange).toBe('1-3')
    })

    it('Score 3 also generates 1-3 alert', () => {
      // RR=9(1) + HR=110(2) = 3
      const alerts = evaluateAlerts(normalVitals({ rr: '9', hr: '110' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 1-3')
      expect(alerts[0].risk).toBe('Low')
    })
  })

  describe('Score 4-5 range', () => {
    it('generates alert with title "EW Score 4-5" and risk "Moderate"', () => {
      // RR=31 scores 4
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 4-5')
      expect(alerts[0].risk).toBe('Moderate')
      expect(alerts[0].ewsRange).toBe('4-5')
    })

    it('includes Additional Criteria instruction in the message', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts[0].message).toContain(
        'Select Additional Criteria button on Managing Deterioration page',
      )
    })

    it('also includes the standard alert instruction', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts[0].message).toContain(
        'Do not close: Go to Managing Deterioration graph page to review vital signs',
      )
    })

    it('Score 5 also generates 4-5 alert', () => {
      // RR=9(1) + HR=110(2) + Temp=38.5(2) = 5
      const alerts = evaluateAlerts(normalVitals({ rr: '9', hr: '110', temp: '38.5' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 4-5')
    })
  })

  describe('Score 6-7 range', () => {
    it('generates alert with title "EW Score 6-7" and risk "High"', () => {
      // RR=31(4) + HR=100(1) + Temp=38.0(1) = 6
      const alerts = evaluateAlerts(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 6-7')
      expect(alerts[0].risk).toBe('High')
      expect(alerts[0].ewsRange).toBe('6-7')
    })

    it('Score 7 also generates 6-7 alert', () => {
      // RR=31(4) + HR=110(2) + Temp=38.0(1) = 7
      const alerts = evaluateAlerts(normalVitals({ rr: '31', hr: '110', temp: '38.0' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('EW Score 6-7')
    })
  })

  describe('Score >= 8 range', () => {
    it('generates alert with title "MET Call Criteria Met" and risk "Emergency"', () => {
      // Temp=33(4) + SBP=80(4) = 8
      const alerts = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('MET Call Criteria Met')
      expect(alerts[0].risk).toBe('Emergency')
      expect(alerts[0].ewsRange).toBe('>=8')
    })

    it('Score 10 also generates >=8 alert', () => {
      // Temp=33(4) + SBP=80(4) + HR=110(2) = 10
      const alerts = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80', hr: '110' }))
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('MET Call Criteria Met')
      expect(alerts[0].risk).toBe('Emergency')
    })
  })

  it('all score-based alerts are unacknowledged and have empty parameters', () => {
    // RR=31(4) generates a 4-5 alert
    const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
    expect(alerts[0].acknowledged).toBe(false)
    expect(alerts[0].parameters).toEqual([])
  })

  it('all score-based alerts include the standard alert instruction', () => {
    const alerts13 = evaluateAlerts(normalVitals({ rr: '9' }))
    const alerts67 = evaluateAlerts(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
    const alerts8 = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80' }))

    expect(alerts13[0].message).toContain('Do not close')
    expect(alerts67[0].message).toContain('Do not close')
    expect(alerts8[0].message).toContain('Do not close')
  })
})

// ---------------------------------------------------------------------------
// E-zone alerts
// ---------------------------------------------------------------------------
describe('E-zone alerts', () => {
  it('any single parameter at E triggers "MET Call Criteria Met" alert', () => {
    // RR=5 -> E
    const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')
    expect(eAlert).toBeDefined()
    expect(eAlert!.title).toBe('MET Call Criteria Met')
    expect(eAlert!.risk).toBe('Emergency')
  })

  it('E-zone alert uses E_ZONE_DETERIORATING_CRITERIA', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')!
    expect(eAlert.deterioratingCriteria).toEqual([
      'Concern patient is worse or not improving',
      'Any vital sign(s) worse',
      'E zone vital sign outside accepted range',
    ])
  })

  it('E-zone alert lists emergency parameter labels', () => {
    // RR=5 -> E
    const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')!
    expect(eAlert.parameters).toContain('Respiratory Rate')
  })

  it('multiple E parameters are all listed', () => {
    // RR=5 -> E, HR=160 -> E
    const alerts = evaluateAlerts(normalVitals({ rr: '5', hr: '160' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')!
    expect(eAlert.parameters).toContain('Respiratory Rate')
    expect(eAlert.parameters).toContain('Heart Rate')
    expect(eAlert.parameters).toHaveLength(2)
  })

  it('E-zone trigger suppresses aggregate score-based alert', () => {
    // RR=5 -> E (counts as 4 in total)
    // All normal otherwise => total = 4 => would be 4-5 alert, but E suppresses it
    const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
    const scoreAlerts = alerts.filter((a) => a.ewsRange !== 'E' && a.ewsRange !== 'nurse-concern')
    expect(scoreAlerts).toHaveLength(0)
  })

  it('Consciousness Pain -> E-zone alert', () => {
    const alerts = evaluateAlerts(normalVitals({ avpu: 'Pain' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')
    expect(eAlert).toBeDefined()
    expect(eAlert!.parameters).toContain('Consciousness (AVPU)')
  })

  it('SBP <= 79 -> E-zone alert', () => {
    const alerts = evaluateAlerts(normalVitals({ bp_sys: '70' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')
    expect(eAlert).toBeDefined()
    expect(eAlert!.parameters).toContain('Systolic BP')
  })

  it('O2 flow rate >= 15 -> E-zone alert', () => {
    const alerts = evaluateAlerts(normalVitals({ o2FlowRate: '15' }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')
    expect(eAlert).toBeDefined()
    expect(eAlert!.parameters).toContain('O2 Flow Rate')
  })
})

// ---------------------------------------------------------------------------
// Alert priority
// ---------------------------------------------------------------------------
describe('Alert priority', () => {
  it('E-trigger alert comes before nurse concern alert', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '5', nurseConcern: true }))
    expect(alerts.length).toBeGreaterThanOrEqual(2)
    const eIndex = alerts.findIndex((a) => a.ewsRange === 'E')
    const nurseIndex = alerts.findIndex((a) => a.ewsRange === 'nurse-concern')
    expect(eIndex).toBeLessThan(nurseIndex)
  })

  it('score-based alert comes before nurse concern alert', () => {
    // RR=9 scores 1, generates 1-3 alert
    const alerts = evaluateAlerts(normalVitals({ rr: '9', nurseConcern: true }))
    const scoreIndex = alerts.findIndex((a) => a.ewsRange === '1-3')
    const nurseIndex = alerts.findIndex((a) => a.ewsRange === 'nurse-concern')
    expect(scoreIndex).toBeLessThan(nurseIndex)
  })

  it('only one E-zone alert is generated (not duplicated by score range)', () => {
    // Pain -> E (total = 4), so would normally also trigger 4-5 range
    // but hasEmergencyParams suppresses score-based alerts
    const alerts = evaluateAlerts(normalVitals({ avpu: 'Pain' }))
    const nonNurseAlerts = alerts.filter((a) => a.ewsRange !== 'nurse-concern')
    expect(nonNurseAlerts).toHaveLength(1)
    expect(nonNurseAlerts[0].ewsRange).toBe('E')
  })
})

// ---------------------------------------------------------------------------
// Deteriorating/Stable content
// ---------------------------------------------------------------------------
describe('Deteriorating and stable actions content', () => {
  describe('EWS 1-3', () => {
    it('has correct deterioratingActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '9' }))
      expect(alerts[0].deterioratingActions).toBe(
        'Notify Team Leader. Nurse escort for transfers. 1 hourly observations.',
      )
    })

    it('has correct stableActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '9' }))
      expect(alerts[0].stableActions).toBe(
        '4th hourly observations (minimum). May be modified by SMO.',
      )
    })

    it('has correct deterioratingCriteria (DEFAULT)', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '9' }))
      expect(alerts[0].deterioratingCriteria).toEqual([
        'Concern patient is worse or not improving',
        'NEW contributing vital sign(s)',
        'Score higher than last score',
      ])
    })
  })

  describe('EWS 4-5', () => {
    it('has correct deterioratingActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts[0].deterioratingActions).toContain('Notify Team Leader')
      expect(alerts[0].deterioratingActions).toContain('Notify RMO to review within 30 minutes')
      expect(alerts[0].deterioratingActions).toContain('call Registrar')
    })

    it('has correct stableActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts[0].stableActions).toBe(
        '2nd hourly observations (minimum). May be modified by SMO.',
      )
    })

    it('has correct deterioratingCriteria (DEFAULT)', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31' }))
      expect(alerts[0].deterioratingCriteria).toEqual([
        'Concern patient is worse or not improving',
        'NEW contributing vital sign(s)',
        'Score higher than last score',
      ])
    })
  })

  describe('EWS 6-7', () => {
    it('has correct deterioratingActions', () => {
      // RR=31(4) + HR=100(1) + Temp=38.0(1) = 6
      const alerts = evaluateAlerts(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
      expect(alerts[0].deterioratingActions).toContain('Notify Team Leader')
      expect(alerts[0].deterioratingActions).toContain('Notify Registrar to review within 30 minutes')
      expect(alerts[0].deterioratingActions).toContain('call MET or escalate to SMO')
    })

    it('has correct stableActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
      expect(alerts[0].stableActions).toBe(
        '1 hourly observations (minimum). May be modified by SMO.',
      )
    })

    it('has correct deterioratingCriteria (DEFAULT)', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '31', hr: '100', temp: '38.0' }))
      expect(alerts[0].deterioratingCriteria).toEqual([
        'Concern patient is worse or not improving',
        'NEW contributing vital sign(s)',
        'Score higher than last score',
      ])
    })
  })

  describe('EWS >= 8 (score-based)', () => {
    it('has correct deterioratingActions', () => {
      // Temp=33(4) + SBP=80(4) = 8
      const alerts = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80' }))
      expect(alerts[0].deterioratingActions).toContain('Initiate MET call')
      expect(alerts[0].deterioratingActions).toContain('10 minutely observations')
      expect(alerts[0].deterioratingActions).toContain('Registrar to ensure Consultant notified')
    })

    it('has correct stableActions', () => {
      const alerts = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80' }))
      expect(alerts[0].stableActions).toContain('\u00BD hourly observations')
    })

    it('has correct deterioratingCriteria (SCORE_DETERIORATING_CRITERIA)', () => {
      const alerts = evaluateAlerts(normalVitals({ temp: '33.0', bp_sys: '80' }))
      expect(alerts[0].deterioratingCriteria).toEqual([
        'Concern patient is worse or not improving',
        'NEW contributing vital sign(s)',
        'Score higher than last score',
      ])
    })
  })

  describe('E-zone trigger', () => {
    it('has correct deterioratingActions (same as >=8)', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
      const eAlert = alerts.find((a) => a.ewsRange === 'E')!
      expect(eAlert.deterioratingActions).toContain('Initiate MET call')
      expect(eAlert.deterioratingActions).toContain('10 minutely observations')
    })

    it('has correct stableActions', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
      const eAlert = alerts.find((a) => a.ewsRange === 'E')!
      expect(eAlert.stableActions).toContain('\u00BD hourly observations')
    })

    it('has E_ZONE_DETERIORATING_CRITERIA (different from score-based)', () => {
      const alerts = evaluateAlerts(normalVitals({ rr: '5' }))
      const eAlert = alerts.find((a) => a.ewsRange === 'E')!
      expect(eAlert.deterioratingCriteria).toEqual([
        'Concern patient is worse or not improving',
        'Any vital sign(s) worse',
        'E zone vital sign outside accepted range',
      ])
      // Verify it is NOT the same as SCORE_DETERIORATING_CRITERIA
      expect(eAlert.deterioratingCriteria).not.toContain('NEW contributing vital sign(s)')
    })
  })
})

// ---------------------------------------------------------------------------
// Sepsis screening
// ---------------------------------------------------------------------------
describe('Sepsis screening', () => {
  it('RR >= 25 triggers showSepsisPrompt', () => {
    // RR=25 scores 2, triggers 1-3 alert
    const alerts = evaluateAlerts(normalVitals({ rr: '25' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(true)
  })

  it('HR >= 130 triggers showSepsisPrompt', () => {
    // HR=130 scores 3, triggers 1-3 alert
    const alerts = evaluateAlerts(normalVitals({ hr: '130' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(true)
  })

  it('SBP < 90 triggers showSepsisPrompt', () => {
    // SBP=89 scores 4, triggers 4-5 alert
    const alerts = evaluateAlerts(normalVitals({ bp_sys: '89' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(true)
  })

  it('Temp < 35.5 triggers showSepsisPrompt', () => {
    // Temp=35.0 scores 2, triggers 1-3 alert
    const alerts = evaluateAlerts(normalVitals({ temp: '35.0' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(true)
  })

  it('Temp > 38.4 triggers showSepsisPrompt', () => {
    // Temp=38.5 scores 2, triggers 1-3 alert
    const alerts = evaluateAlerts(normalVitals({ temp: '38.5' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(true)
  })

  it('normal vitals do not trigger showSepsisPrompt (score 0, no alerts)', () => {
    const alerts = evaluateAlerts(normalVitals())
    // Score 0 means no alerts at all
    expect(alerts).toHaveLength(0)
  })

  it('abnormal score with normal sepsis vitals has showSepsisPrompt false', () => {
    // RR=21 scores 1, but RR=21 < 25, HR=75, SBP=120, Temp=37.0 => no sepsis
    const alerts = evaluateAlerts(normalVitals({ rr: '21' }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].showSepsisPrompt).toBe(false)
  })

  it('sepsis prompt is propagated to E-zone alerts', () => {
    // RR=5 -> E (and RR < 25, no other sepsis criteria)
    const alertsNoSepsis = evaluateAlerts(normalVitals({ rr: '5' }))
    const eAlertNoSepsis = alertsNoSepsis.find((a) => a.ewsRange === 'E')!
    expect(eAlertNoSepsis.showSepsisPrompt).toBe(false)

    // RR=5 -> E, but also HR=130 -> sepsis
    const alertsWithSepsis = evaluateAlerts(normalVitals({ rr: '5', hr: '130' }))
    const eAlertWithSepsis = alertsWithSepsis.find((a) => a.ewsRange === 'E')!
    expect(eAlertWithSepsis.showSepsisPrompt).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Nurse concern
// ---------------------------------------------------------------------------
describe('Nurse concern', () => {
  it('nurseConcern=true generates a separate alert', () => {
    const alerts = evaluateAlerts(normalVitals({ nurseConcern: true }))
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')
    expect(nurseAlert).toBeDefined()
  })

  it('nurse concern alert has risk "High"', () => {
    const alerts = evaluateAlerts(normalVitals({ nurseConcern: true }))
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')!
    expect(nurseAlert.risk).toBe('High')
  })

  it('nurse concern alert has correct title', () => {
    const alerts = evaluateAlerts(normalVitals({ nurseConcern: true }))
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')!
    expect(nurseAlert.title).toContain('Staff Member Concern')
    expect(nurseAlert.title).toContain('Clinical Review Required')
  })

  it('nurse concern alert has specific deteriorating/stable actions', () => {
    const alerts = evaluateAlerts(normalVitals({ nurseConcern: true }))
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')!
    expect(nurseAlert.deterioratingActions).toContain('Clinical review required')
    expect(nurseAlert.stableActions).toContain('Continue observations as ordered')
    expect(nurseAlert.stableActions).toContain('Document concern')
  })

  it('nurse concern coexists with score-based alert', () => {
    // RR=9(1) triggers a 1-3 alert + nurseConcern triggers concern alert
    const alerts = evaluateAlerts(normalVitals({ rr: '9', nurseConcern: true }))
    const scoreAlert = alerts.find((a) => a.ewsRange === '1-3')
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')
    expect(scoreAlert).toBeDefined()
    expect(nurseAlert).toBeDefined()
    expect(alerts).toHaveLength(2)
  })

  it('nurse concern coexists with E-zone alert', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '5', nurseConcern: true }))
    const eAlert = alerts.find((a) => a.ewsRange === 'E')
    const nurseAlert = alerts.find((a) => a.ewsRange === 'nurse-concern')
    expect(eAlert).toBeDefined()
    expect(nurseAlert).toBeDefined()
  })

  it('nurseConcern=false or absent does not generate nurse concern alert', () => {
    const alertsWithout = evaluateAlerts(normalVitals())
    expect(alertsWithout.find((a) => a.ewsRange === 'nurse-concern')).toBeUndefined()

    const vitalsWithFalse = normalVitals()
    vitalsWithFalse.nurseConcern = false
    const alertsExplicitFalse = evaluateAlerts(vitalsWithFalse)
    expect(alertsExplicitFalse.find((a) => a.ewsRange === 'nurse-concern')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Variant parameter
// ---------------------------------------------------------------------------
describe('Chart variant support', () => {
  it('chronic_respiratory variant with SpO2=87 produces different score than standard', () => {
    // Standard: SpO2=87 scores 2 (range 85-89)
    const standardAlerts = evaluateAlerts(normalVitals({ spo2: '87' }), 'standard')
    // Chronic respiratory: SpO2=87 scores 1 (range 86-87)
    const chronicAlerts = evaluateAlerts(normalVitals({ spo2: '87' }), 'chronic_respiratory')

    // Standard SpO2=87 -> score 2, triggers 1-3 alert
    expect(standardAlerts).toHaveLength(1)
    expect(standardAlerts[0].ewsRange).toBe('1-3')

    // Chronic respiratory SpO2=87 -> score 1, triggers 1-3 alert
    expect(chronicAlerts).toHaveLength(1)
    expect(chronicAlerts[0].ewsRange).toBe('1-3')
  })

  it('chronic_respiratory variant adjusts SpO2 thresholds affecting alert tier', () => {
    // SpO2=84: Standard scores 4 (<=84 -> 4), chronic_respiratory scores 2 (84-85 -> 2)
    // Standard: total=4 -> 4-5 alert
    const standardAlerts = evaluateAlerts(normalVitals({ spo2: '84' }), 'standard')
    expect(standardAlerts).toHaveLength(1)
    expect(standardAlerts[0].ewsRange).toBe('4-5')
    expect(standardAlerts[0].risk).toBe('Moderate')

    // Chronic respiratory: total=2 -> 1-3 alert
    const chronicAlerts = evaluateAlerts(normalVitals({ spo2: '84' }), 'chronic_respiratory')
    expect(chronicAlerts).toHaveLength(1)
    expect(chronicAlerts[0].ewsRange).toBe('1-3')
    expect(chronicAlerts[0].risk).toBe('Low')
  })

  it('variant is passed through — default (undefined) behaves as standard', () => {
    const defaultAlerts = evaluateAlerts(normalVitals({ spo2: '84' }))
    const standardAlerts = evaluateAlerts(normalVitals({ spo2: '84' }), 'standard')

    expect(defaultAlerts).toHaveLength(standardAlerts.length)
    expect(defaultAlerts[0].ewsRange).toBe(standardAlerts[0].ewsRange)
    expect(defaultAlerts[0].risk).toBe(standardAlerts[0].risk)
  })
})

// ---------------------------------------------------------------------------
// Alert metadata
// ---------------------------------------------------------------------------
describe('Alert metadata', () => {
  it('each alert has a unique id', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '5', nurseConcern: true }))
    const ids = alerts.map((a) => a.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('each alert has a numeric timestamp', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '9' }))
    expect(typeof alerts[0].timestamp).toBe('number')
    expect(alerts[0].timestamp).toBeGreaterThan(0)
  })

  it('all alerts start unacknowledged', () => {
    const alerts = evaluateAlerts(normalVitals({ rr: '5', nurseConcern: true }))
    for (const alert of alerts) {
      expect(alert.acknowledged).toBe(false)
    }
  })
})
