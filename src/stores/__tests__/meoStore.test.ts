/**
 * MEO Store Tests
 *
 * Validates the Zustand store for MET-MEO (Modified Escalation and Observation)
 * state management: order CRUD, dialog visibility, and assessment tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMeoStore } from '@/stores/meoStore'
import type {
  MetMeoOrder,
  ModifiedObsFrequencyOrder,
  NursingAssessment,
  SedationAssessment,
} from '@/types/meo'

// ---------------------------------------------------------------------------
// Helpers — factory functions for creating test data
// ---------------------------------------------------------------------------

function makeMetMeoOrder(overrides: Partial<MetMeoOrder> = {}): MetMeoOrder {
  const signedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // +12h
  return {
    orderId: 'met-001',
    orderType: 'MET_MEO_PLAN',
    triggerType: 'EWS_GTE_8',
    eZoneVitalSign: null,
    eZoneLowerBound: null,
    eZoneUpperBound: null,
    eZoneCavpuLevel: null,
    rationale: 'Patient persistently triggers MET call criteria due to chronic condition',
    durationHours: 12,
    authorisingClinicianName: 'Dr Smith',
    authorisingClinicianRole: 'REGISTRAR',
    signedAt,
    expiresAt,
    cancelledAt: null,
    status: 'ACTIVE',
    ...overrides,
  }
}

function makeExpiredMetMeoOrder(overrides: Partial<MetMeoOrder> = {}): MetMeoOrder {
  const signedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // -24h
  const expiresAt = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // -12h (expired)
  return makeMetMeoOrder({
    orderId: 'met-expired',
    signedAt,
    expiresAt,
    status: 'ACTIVE', // still ACTIVE status but expiresAt is in the past
    ...overrides,
  })
}

function makeMofOrder(overrides: Partial<ModifiedObsFrequencyOrder> = {}): ModifiedObsFrequencyOrder {
  return {
    orderId: 'mof-001',
    orderType: 'MODIFIED_OBS_FREQUENCY',
    optionSelected: 'LONG_STAY_RESPITE',
    frequencyHours: 8,
    otherFreeText: null,
    authorisingSmoName: 'Dr Jones',
    signedAt: new Date().toISOString(),
    cancelledAt: null,
    status: 'ACTIVE',
    ...overrides,
  }
}

function makeNursingAssessment(overrides: Partial<NursingAssessment> = {}): NursingAssessment {
  return {
    assessmentId: 'na-001',
    metMeoOrderId: 'met-001',
    assessmentTime: new Date().toISOString(),
    patientStatus: 'STABLE',
    observationComments: null,
    criterionConcernWorse: false,
    criterionNewVitalSigns: false,
    criterionScoreHigher: false,
    ...overrides,
  }
}

function makeSedationAssessment(overrides: Partial<SedationAssessment> = {}): SedationAssessment {
  return {
    assessmentId: 'sa-001',
    assessmentTime: new Date().toISOString(),
    score: 0,
    comments: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset store before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  useMeoStore.setState(useMeoStore.getInitialState())
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
describe('Initial state', () => {
  it('has empty metMeoOrders array', () => {
    expect(useMeoStore.getState().metMeoOrders).toEqual([])
  })

  it('has empty mofOrders array', () => {
    expect(useMeoStore.getState().mofOrders).toEqual([])
  })

  it('has empty nursingAssessments array', () => {
    expect(useMeoStore.getState().nursingAssessments).toEqual([])
  })

  it('has empty sedationAssessments array', () => {
    expect(useMeoStore.getState().sedationAssessments).toEqual([])
  })

  it('has showMeoDialog set to false', () => {
    expect(useMeoStore.getState().showMeoDialog).toBe(false)
  })

  it('has showMetMeoForm set to false', () => {
    expect(useMeoStore.getState().showMetMeoForm).toBe(false)
  })

  it('has showMofForm set to false', () => {
    expect(useMeoStore.getState().showMofForm).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetMeo order management
// ---------------------------------------------------------------------------
describe('MetMeo order management', () => {
  describe('addMetMeoOrder', () => {
    it('adds a single order to metMeoOrders', () => {
      const order = makeMetMeoOrder()
      useMeoStore.getState().addMetMeoOrder(order)

      const state = useMeoStore.getState()
      expect(state.metMeoOrders).toHaveLength(1)
      expect(state.metMeoOrders[0]).toEqual(order)
    })

    it('appends multiple orders preserving insertion order', () => {
      const order1 = makeMetMeoOrder({ orderId: 'met-001' })
      const order2 = makeMetMeoOrder({ orderId: 'met-002' })

      useMeoStore.getState().addMetMeoOrder(order1)
      useMeoStore.getState().addMetMeoOrder(order2)

      const state = useMeoStore.getState()
      expect(state.metMeoOrders).toHaveLength(2)
      expect(state.metMeoOrders[0].orderId).toBe('met-001')
      expect(state.metMeoOrders[1].orderId).toBe('met-002')
    })

    it('does not affect other state slices', () => {
      useMeoStore.getState().addMetMeoOrder(makeMetMeoOrder())

      const state = useMeoStore.getState()
      expect(state.mofOrders).toEqual([])
      expect(state.nursingAssessments).toEqual([])
      expect(state.sedationAssessments).toEqual([])
      expect(state.showMeoDialog).toBe(false)
    })
  })

  describe('cancelMetMeoOrder', () => {
    it('sets status to CANCELLED for the matching order', () => {
      const order = makeMetMeoOrder({ orderId: 'met-cancel' })
      useMeoStore.getState().addMetMeoOrder(order)

      useMeoStore.getState().cancelMetMeoOrder('met-cancel')

      const cancelled = useMeoStore.getState().metMeoOrders[0]
      expect(cancelled.status).toBe('CANCELLED')
    })

    it('sets cancelledAt timestamp', () => {
      const order = makeMetMeoOrder({ orderId: 'met-cancel' })
      useMeoStore.getState().addMetMeoOrder(order)
      expect(order.cancelledAt).toBeNull()

      const beforeCancel = new Date().toISOString()
      useMeoStore.getState().cancelMetMeoOrder('met-cancel')
      const afterCancel = new Date().toISOString()

      const cancelled = useMeoStore.getState().metMeoOrders[0]
      expect(cancelled.cancelledAt).not.toBeNull()
      expect(cancelled.cancelledAt! >= beforeCancel).toBe(true)
      expect(cancelled.cancelledAt! <= afterCancel).toBe(true)
    })

    it('does not modify other orders', () => {
      const order1 = makeMetMeoOrder({ orderId: 'met-keep' })
      const order2 = makeMetMeoOrder({ orderId: 'met-cancel' })
      useMeoStore.getState().addMetMeoOrder(order1)
      useMeoStore.getState().addMetMeoOrder(order2)

      useMeoStore.getState().cancelMetMeoOrder('met-cancel')

      const orders = useMeoStore.getState().metMeoOrders
      expect(orders[0].status).toBe('ACTIVE')
      expect(orders[0].cancelledAt).toBeNull()
      expect(orders[1].status).toBe('CANCELLED')
    })

    it('no-ops when orderId does not exist', () => {
      const order = makeMetMeoOrder({ orderId: 'met-001' })
      useMeoStore.getState().addMetMeoOrder(order)

      useMeoStore.getState().cancelMetMeoOrder('nonexistent')

      const orders = useMeoStore.getState().metMeoOrders
      expect(orders).toHaveLength(1)
      expect(orders[0].status).toBe('ACTIVE')
    })
  })

  describe('getActiveMetMeo', () => {
    it('returns the first active non-expired order', () => {
      const order = makeMetMeoOrder({ orderId: 'met-active' })
      useMeoStore.getState().addMetMeoOrder(order)

      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).not.toBeNull()
      expect(active!.orderId).toBe('met-active')
    })

    it('returns null when no orders exist', () => {
      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).toBeNull()
    })

    it('returns null when all orders are cancelled', () => {
      const order = makeMetMeoOrder({ orderId: 'met-c', status: 'CANCELLED', cancelledAt: new Date().toISOString() })
      useMeoStore.getState().addMetMeoOrder(order)

      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).toBeNull()
    })

    it('returns null when all orders have expired (expiresAt in the past)', () => {
      const expired = makeExpiredMetMeoOrder()
      useMeoStore.getState().addMetMeoOrder(expired)

      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).toBeNull()
    })

    it('skips cancelled and expired orders and returns the first valid active one', () => {
      const cancelledOrder = makeMetMeoOrder({
        orderId: 'met-cancelled',
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      })
      const expiredOrder = makeExpiredMetMeoOrder({ orderId: 'met-expired' })
      const activeOrder = makeMetMeoOrder({ orderId: 'met-active' })

      useMeoStore.getState().addMetMeoOrder(cancelledOrder)
      useMeoStore.getState().addMetMeoOrder(expiredOrder)
      useMeoStore.getState().addMetMeoOrder(activeOrder)

      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).not.toBeNull()
      expect(active!.orderId).toBe('met-active')
    })

    it('returns null for orders with EXPIRED status', () => {
      const expiredStatus = makeMetMeoOrder({
        orderId: 'met-exp-status',
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      })
      useMeoStore.getState().addMetMeoOrder(expiredStatus)

      const active = useMeoStore.getState().getActiveMetMeo()
      expect(active).toBeNull()
    })

    it('reflects cancellation — returns null after the only active order is cancelled', () => {
      const order = makeMetMeoOrder({ orderId: 'met-sole' })
      useMeoStore.getState().addMetMeoOrder(order)
      expect(useMeoStore.getState().getActiveMetMeo()).not.toBeNull()

      useMeoStore.getState().cancelMetMeoOrder('met-sole')
      expect(useMeoStore.getState().getActiveMetMeo()).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Modified Obs Frequency (MOF) order management
// ---------------------------------------------------------------------------
describe('MOF order management', () => {
  describe('addMofOrder', () => {
    it('adds a single MOF order', () => {
      const order = makeMofOrder()
      useMeoStore.getState().addMofOrder(order)

      const state = useMeoStore.getState()
      expect(state.mofOrders).toHaveLength(1)
      expect(state.mofOrders[0]).toEqual(order)
    })

    it('appends multiple MOF orders preserving insertion order', () => {
      const order1 = makeMofOrder({ orderId: 'mof-001' })
      const order2 = makeMofOrder({ orderId: 'mof-002', optionSelected: 'STABLE_EXPECTED' })

      useMeoStore.getState().addMofOrder(order1)
      useMeoStore.getState().addMofOrder(order2)

      const state = useMeoStore.getState()
      expect(state.mofOrders).toHaveLength(2)
      expect(state.mofOrders[0].orderId).toBe('mof-001')
      expect(state.mofOrders[1].orderId).toBe('mof-002')
    })

    it('does not affect metMeoOrders or other state', () => {
      useMeoStore.getState().addMofOrder(makeMofOrder())

      const state = useMeoStore.getState()
      expect(state.metMeoOrders).toEqual([])
      expect(state.nursingAssessments).toEqual([])
    })
  })

  describe('cancelMofOrder', () => {
    it('sets status to CANCELLED for the matching MOF order', () => {
      const order = makeMofOrder({ orderId: 'mof-cancel' })
      useMeoStore.getState().addMofOrder(order)

      useMeoStore.getState().cancelMofOrder('mof-cancel')

      const cancelled = useMeoStore.getState().mofOrders[0]
      expect(cancelled.status).toBe('CANCELLED')
    })

    it('sets cancelledAt timestamp on the MOF order', () => {
      const order = makeMofOrder({ orderId: 'mof-cancel' })
      useMeoStore.getState().addMofOrder(order)

      const beforeCancel = new Date().toISOString()
      useMeoStore.getState().cancelMofOrder('mof-cancel')
      const afterCancel = new Date().toISOString()

      const cancelled = useMeoStore.getState().mofOrders[0]
      expect(cancelled.cancelledAt).not.toBeNull()
      expect(cancelled.cancelledAt! >= beforeCancel).toBe(true)
      expect(cancelled.cancelledAt! <= afterCancel).toBe(true)
    })

    it('does not modify other MOF orders', () => {
      const order1 = makeMofOrder({ orderId: 'mof-keep' })
      const order2 = makeMofOrder({ orderId: 'mof-cancel' })
      useMeoStore.getState().addMofOrder(order1)
      useMeoStore.getState().addMofOrder(order2)

      useMeoStore.getState().cancelMofOrder('mof-cancel')

      const orders = useMeoStore.getState().mofOrders
      expect(orders[0].status).toBe('ACTIVE')
      expect(orders[0].cancelledAt).toBeNull()
      expect(orders[1].status).toBe('CANCELLED')
    })

    it('no-ops when orderId does not exist', () => {
      const order = makeMofOrder({ orderId: 'mof-001' })
      useMeoStore.getState().addMofOrder(order)

      useMeoStore.getState().cancelMofOrder('nonexistent')

      expect(useMeoStore.getState().mofOrders[0].status).toBe('ACTIVE')
    })
  })

  describe('getActiveMof', () => {
    it('returns the first active MOF order', () => {
      const order = makeMofOrder({ orderId: 'mof-active' })
      useMeoStore.getState().addMofOrder(order)

      const active = useMeoStore.getState().getActiveMof()
      expect(active).not.toBeNull()
      expect(active!.orderId).toBe('mof-active')
    })

    it('returns null when no MOF orders exist', () => {
      const active = useMeoStore.getState().getActiveMof()
      expect(active).toBeNull()
    })

    it('returns null when all MOF orders are cancelled', () => {
      const order = makeMofOrder({
        orderId: 'mof-c',
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      })
      useMeoStore.getState().addMofOrder(order)

      const active = useMeoStore.getState().getActiveMof()
      expect(active).toBeNull()
    })

    it('skips cancelled orders and returns the first active one', () => {
      const cancelledOrder = makeMofOrder({
        orderId: 'mof-cancelled',
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      })
      const activeOrder = makeMofOrder({ orderId: 'mof-active' })

      useMeoStore.getState().addMofOrder(cancelledOrder)
      useMeoStore.getState().addMofOrder(activeOrder)

      const active = useMeoStore.getState().getActiveMof()
      expect(active).not.toBeNull()
      expect(active!.orderId).toBe('mof-active')
    })

    it('reflects cancellation — returns null after the only active order is cancelled', () => {
      const order = makeMofOrder({ orderId: 'mof-sole' })
      useMeoStore.getState().addMofOrder(order)
      expect(useMeoStore.getState().getActiveMof()).not.toBeNull()

      useMeoStore.getState().cancelMofOrder('mof-sole')
      expect(useMeoStore.getState().getActiveMof()).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Dialog visibility state
// ---------------------------------------------------------------------------
describe('Dialog visibility state', () => {
  describe('showMeoDialog', () => {
    it('openMeoDialog sets showMeoDialog to true', () => {
      useMeoStore.getState().openMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(true)
    })

    it('closeMeoDialog sets showMeoDialog to false', () => {
      useMeoStore.getState().openMeoDialog()
      useMeoStore.getState().closeMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(false)
    })

    it('toggling open/close/open works correctly', () => {
      useMeoStore.getState().openMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(true)
      useMeoStore.getState().closeMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(false)
      useMeoStore.getState().openMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(true)
    })

    it('calling openMeoDialog twice does not cause issues', () => {
      useMeoStore.getState().openMeoDialog()
      useMeoStore.getState().openMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(true)
    })

    it('calling closeMeoDialog when already false is a no-op', () => {
      useMeoStore.getState().closeMeoDialog()
      expect(useMeoStore.getState().showMeoDialog).toBe(false)
    })
  })

  describe('showMetMeoForm', () => {
    it('openMetMeoForm sets showMetMeoForm to true', () => {
      useMeoStore.getState().openMetMeoForm()
      expect(useMeoStore.getState().showMetMeoForm).toBe(true)
    })

    it('closeMetMeoForm sets showMetMeoForm to false', () => {
      useMeoStore.getState().openMetMeoForm()
      useMeoStore.getState().closeMetMeoForm()
      expect(useMeoStore.getState().showMetMeoForm).toBe(false)
    })

    it('does not affect other dialog flags', () => {
      useMeoStore.getState().openMetMeoForm()
      expect(useMeoStore.getState().showMeoDialog).toBe(false)
      expect(useMeoStore.getState().showMofForm).toBe(false)
    })
  })

  describe('showMofForm', () => {
    it('openMofForm sets showMofForm to true', () => {
      useMeoStore.getState().openMofForm()
      expect(useMeoStore.getState().showMofForm).toBe(true)
    })

    it('closeMofForm sets showMofForm to false', () => {
      useMeoStore.getState().openMofForm()
      useMeoStore.getState().closeMofForm()
      expect(useMeoStore.getState().showMofForm).toBe(false)
    })

    it('does not affect other dialog flags', () => {
      useMeoStore.getState().openMofForm()
      expect(useMeoStore.getState().showMeoDialog).toBe(false)
      expect(useMeoStore.getState().showMetMeoForm).toBe(false)
    })
  })

  describe('independence of dialog flags', () => {
    it('all three dialogs can be open simultaneously', () => {
      useMeoStore.getState().openMeoDialog()
      useMeoStore.getState().openMetMeoForm()
      useMeoStore.getState().openMofForm()

      const state = useMeoStore.getState()
      expect(state.showMeoDialog).toBe(true)
      expect(state.showMetMeoForm).toBe(true)
      expect(state.showMofForm).toBe(true)
    })

    it('closing one dialog does not affect others', () => {
      useMeoStore.getState().openMeoDialog()
      useMeoStore.getState().openMetMeoForm()
      useMeoStore.getState().openMofForm()

      useMeoStore.getState().closeMeoDialog()

      const state = useMeoStore.getState()
      expect(state.showMeoDialog).toBe(false)
      expect(state.showMetMeoForm).toBe(true)
      expect(state.showMofForm).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Nursing assessment management
// ---------------------------------------------------------------------------
describe('Nursing assessment management', () => {
  it('addNursingAssessment adds an assessment', () => {
    const assessment = makeNursingAssessment()
    useMeoStore.getState().addNursingAssessment(assessment)

    const state = useMeoStore.getState()
    expect(state.nursingAssessments).toHaveLength(1)
    expect(state.nursingAssessments[0]).toEqual(assessment)
  })

  it('adds multiple assessments preserving insertion order', () => {
    const a1 = makeNursingAssessment({ assessmentId: 'na-001', patientStatus: 'STABLE' })
    const a2 = makeNursingAssessment({ assessmentId: 'na-002', patientStatus: 'DETERIORATING' })

    useMeoStore.getState().addNursingAssessment(a1)
    useMeoStore.getState().addNursingAssessment(a2)

    const assessments = useMeoStore.getState().nursingAssessments
    expect(assessments).toHaveLength(2)
    expect(assessments[0].assessmentId).toBe('na-001')
    expect(assessments[1].assessmentId).toBe('na-002')
  })

  it('assessments are retrievable with full data intact', () => {
    const assessment = makeNursingAssessment({
      assessmentId: 'na-detailed',
      metMeoOrderId: 'met-001',
      patientStatus: 'DETERIORATING',
      observationComments: 'Patient showing signs of deterioration',
      criterionConcernWorse: true,
      criterionNewVitalSigns: true,
      criterionScoreHigher: false,
    })

    useMeoStore.getState().addNursingAssessment(assessment)

    const stored = useMeoStore.getState().nursingAssessments[0]
    expect(stored.assessmentId).toBe('na-detailed')
    expect(stored.metMeoOrderId).toBe('met-001')
    expect(stored.patientStatus).toBe('DETERIORATING')
    expect(stored.observationComments).toBe('Patient showing signs of deterioration')
    expect(stored.criterionConcernWorse).toBe(true)
    expect(stored.criterionNewVitalSigns).toBe(true)
    expect(stored.criterionScoreHigher).toBe(false)
  })

  it('does not affect other state slices', () => {
    useMeoStore.getState().addNursingAssessment(makeNursingAssessment())

    const state = useMeoStore.getState()
    expect(state.metMeoOrders).toEqual([])
    expect(state.mofOrders).toEqual([])
    expect(state.sedationAssessments).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Sedation assessment management
// ---------------------------------------------------------------------------
describe('Sedation assessment management', () => {
  it('addSedationAssessment adds an assessment', () => {
    const assessment = makeSedationAssessment()
    useMeoStore.getState().addSedationAssessment(assessment)

    const state = useMeoStore.getState()
    expect(state.sedationAssessments).toHaveLength(1)
    expect(state.sedationAssessments[0]).toEqual(assessment)
  })

  it('adds multiple sedation assessments preserving insertion order', () => {
    const s1 = makeSedationAssessment({ assessmentId: 'sa-001', score: 0 })
    const s2 = makeSedationAssessment({ assessmentId: 'sa-002', score: 2 })
    const s3 = makeSedationAssessment({ assessmentId: 'sa-003', score: 3 })

    useMeoStore.getState().addSedationAssessment(s1)
    useMeoStore.getState().addSedationAssessment(s2)
    useMeoStore.getState().addSedationAssessment(s3)

    const assessments = useMeoStore.getState().sedationAssessments
    expect(assessments).toHaveLength(3)
    expect(assessments[0].score).toBe(0)
    expect(assessments[1].score).toBe(2)
    expect(assessments[2].score).toBe(3)
  })

  it('sedationAssessments contains the full data', () => {
    const assessment = makeSedationAssessment({
      assessmentId: 'sa-detailed',
      score: 1,
      comments: 'Mild sedation, easy to rouse',
    })

    useMeoStore.getState().addSedationAssessment(assessment)

    const stored = useMeoStore.getState().sedationAssessments[0]
    expect(stored.assessmentId).toBe('sa-detailed')
    expect(stored.score).toBe(1)
    expect(stored.comments).toBe('Mild sedation, easy to rouse')
    expect(stored.assessmentTime).toBeDefined()
  })

  it('does not affect other state slices', () => {
    useMeoStore.getState().addSedationAssessment(makeSedationAssessment())

    const state = useMeoStore.getState()
    expect(state.metMeoOrders).toEqual([])
    expect(state.mofOrders).toEqual([])
    expect(state.nursingAssessments).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Store reset via getInitialState
// ---------------------------------------------------------------------------
describe('Store reset', () => {
  it('setState with getInitialState resets all state to defaults', () => {
    // Populate the store with data
    useMeoStore.getState().addMetMeoOrder(makeMetMeoOrder())
    useMeoStore.getState().addMofOrder(makeMofOrder())
    useMeoStore.getState().addNursingAssessment(makeNursingAssessment())
    useMeoStore.getState().addSedationAssessment(makeSedationAssessment())
    useMeoStore.getState().openMeoDialog()
    useMeoStore.getState().openMetMeoForm()
    useMeoStore.getState().openMofForm()

    // Verify populated
    let state = useMeoStore.getState()
    expect(state.metMeoOrders).toHaveLength(1)
    expect(state.mofOrders).toHaveLength(1)
    expect(state.nursingAssessments).toHaveLength(1)
    expect(state.sedationAssessments).toHaveLength(1)
    expect(state.showMeoDialog).toBe(true)

    // Reset
    useMeoStore.setState(useMeoStore.getInitialState())

    // Verify reset
    state = useMeoStore.getState()
    expect(state.metMeoOrders).toEqual([])
    expect(state.mofOrders).toEqual([])
    expect(state.nursingAssessments).toEqual([])
    expect(state.sedationAssessments).toEqual([])
    expect(state.showMeoDialog).toBe(false)
    expect(state.showMetMeoForm).toBe(false)
    expect(state.showMofForm).toBe(false)
  })
})
