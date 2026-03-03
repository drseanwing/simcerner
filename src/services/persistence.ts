/**
 * @file persistence.ts
 * @description IndexedDB persistence layer for the SimCerner EMR.
 *
 * Provides a simple key-value abstraction over IndexedDB for persisting
 * patient data, session state, alert history, and medication administration
 * records across browser reloads.
 *
 * Falls back gracefully to in-memory storage if IndexedDB is unavailable
 * (e.g. in private browsing modes or restricted iframes).
 */

import type { Patient } from '../types/patient';
import type { Alert } from './alertEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** IndexedDB database name. */
const DB_NAME = 'simcerner-db';

/** Database schema version. */
const DB_VERSION = 1;

/** Object store names. */
const STORES = {
  PATIENTS: 'patients',
  SESSIONS: 'sessions',
  ALERTS: 'alerts',
  ADMINISTRATIONS: 'administrations',
} as const;

// ---------------------------------------------------------------------------
// Database Connection
// ---------------------------------------------------------------------------

/** Cached database connection. */
let dbInstance: IDBDatabase | null = null;

/** Whether IndexedDB is available in the current environment. */
let isAvailable: boolean | null = null;

/**
 * Check whether IndexedDB is available in this browser context.
 * Result is memoised after the first call.
 *
 * @returns `true` if IndexedDB is usable.
 */
function checkAvailability(): boolean {
  if (isAvailable !== null) return isAvailable;

  try {
    isAvailable =
      typeof indexedDB !== 'undefined' &&
      indexedDB !== null &&
      typeof indexedDB.open === 'function';
  } catch {
    isAvailable = false;
  }

  if (!isAvailable) {
    // eslint-disable-next-line no-console
    console.warn('[persistence] IndexedDB not available — using in-memory fallback');
  }

  return isAvailable;
}

/**
 * Open (or return the cached) IndexedDB connection, creating
 * object stores on first run.
 *
 * @returns The open IDBDatabase instance.
 * @throws If IndexedDB is unavailable or the open request fails.
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  if (!checkAvailability()) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
        db.createObjectStore(STORES.PATIENTS, { keyPath: 'mrn' });
      }
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        db.createObjectStore(STORES.ALERTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ADMINISTRATIONS)) {
        db.createObjectStore(STORES.ADMINISTRATIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ---------------------------------------------------------------------------
// In-Memory Fallback
// ---------------------------------------------------------------------------

/**
 * Simple in-memory key-value store used when IndexedDB is unavailable.
 * Data is lost on page reload.
 */
const memoryStore: Record<string, Record<string, unknown>> = {
  [STORES.PATIENTS]: {},
  [STORES.SESSIONS]: {},
  [STORES.ALERTS]: {},
  [STORES.ADMINISTRATIONS]: {},
};

// ---------------------------------------------------------------------------
// Generic CRUD Helpers
// ---------------------------------------------------------------------------

/**
 * Write a record to an IndexedDB object store.
 *
 * @param storeName - Target object store.
 * @param record    - The record to write (must contain the key path field).
 */
async function putRecord(storeName: string, record: unknown): Promise<void> {
  if (!checkAvailability()) {
    const rec = record as Record<string, unknown>;
    const key = (rec.mrn ?? rec.id ?? 'unknown') as string;
    memoryStore[storeName][key] = rec;
    return;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Read a single record from an IndexedDB object store by key.
 *
 * @param storeName - Target object store.
 * @param key       - The primary key to look up.
 * @returns The record, or `undefined` if not found.
 */
async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
  if (!checkAvailability()) {
    return memoryStore[storeName][key] as T | undefined;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Read all records from an IndexedDB object store.
 *
 * @param storeName - Target object store.
 * @returns Array of all records in the store.
 */
async function getAllRecords<T>(storeName: string): Promise<T[]> {
  if (!checkAvailability()) {
    return Object.values(memoryStore[storeName]) as T[];
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all records from an IndexedDB object store.
 *
 * @param storeName - Target object store.
 */
async function clearStore(storeName: string): Promise<void> {
  if (!checkAvailability()) {
    memoryStore[storeName] = {};
    return;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// Public API – Patients
// ---------------------------------------------------------------------------

/**
 * Persist a patient record.
 *
 * @param patient - The patient to save (keyed by mrn).
 */
export async function savePatient(patient: Patient): Promise<void> {
  return putRecord(STORES.PATIENTS, patient);
}

/**
 * Retrieve a single patient by MRN.
 *
 * @param mrn - Medical record number.
 * @returns The patient record, or `undefined`.
 */
export async function getPatient(mrn: string): Promise<Patient | undefined> {
  return getRecord<Patient>(STORES.PATIENTS, mrn);
}

/**
 * Retrieve all persisted patients.
 *
 * @returns Array of all patient records.
 */
export async function getAllPatients(): Promise<Patient[]> {
  return getAllRecords<Patient>(STORES.PATIENTS);
}

// ---------------------------------------------------------------------------
// Public API – Sessions
// ---------------------------------------------------------------------------

/** Session state snapshot persisted to IndexedDB. */
export interface PersistedSession {
  /** Fixed key for the singleton session record. */
  id: string;
  /** Active view at time of save. */
  currentView: string;
  /** MRN of the selected patient (if any). */
  currentPatientMrn: string | null;
  /** Simulation time. */
  simulationTime: string;
  /** ISO-8601 timestamp of the save. */
  savedAt: string;
}

/**
 * Persist the current session state.
 *
 * @param session - Session snapshot to save.
 */
export async function saveSession(session: PersistedSession): Promise<void> {
  return putRecord(STORES.SESSIONS, session);
}

/**
 * Retrieve the most recent session state.
 *
 * @returns The persisted session, or `undefined`.
 */
export async function getSession(): Promise<PersistedSession | undefined> {
  return getRecord<PersistedSession>(STORES.SESSIONS, 'current');
}

// ---------------------------------------------------------------------------
// Public API – Alerts
// ---------------------------------------------------------------------------

/**
 * Persist an alert record.
 *
 * @param alert - The alert to save.
 */
export async function saveAlert(alert: Alert): Promise<void> {
  return putRecord(STORES.ALERTS, alert);
}

/**
 * Retrieve all persisted alerts.
 *
 * @returns Array of all alert records.
 */
export async function getAllPersistedAlerts(): Promise<Alert[]> {
  return getAllRecords<Alert>(STORES.ALERTS);
}

// ---------------------------------------------------------------------------
// Public API – Administrations
// ---------------------------------------------------------------------------

/** Medication administration record for persistence. */
export interface PersistedAdministration {
  /** Unique administration event ID. */
  id: string;
  /** MRN of the patient. */
  patientMrn: string;
  /** Medication name. */
  medicationName: string;
  /** ISO-8601 timestamp of administration. */
  timestamp: string;
  /** Nurse who administered. */
  nurse: string;
  /** Status of the administration. */
  status: string;
  /** Optional notes. */
  notes?: string;
}

/**
 * Persist a medication administration event.
 *
 * @param admin - The administration record to save.
 */
export async function saveAdministration(admin: PersistedAdministration): Promise<void> {
  return putRecord(STORES.ADMINISTRATIONS, admin);
}

/**
 * Retrieve all persisted administration records.
 *
 * @returns Array of all administration records.
 */
export async function getAllAdministrations(): Promise<PersistedAdministration[]> {
  return getAllRecords<PersistedAdministration>(STORES.ADMINISTRATIONS);
}

// ---------------------------------------------------------------------------
// Public API – Bulk Operations
// ---------------------------------------------------------------------------

/**
 * Clear all data from every object store. Useful for resetting
 * the entire simulation to a clean state.
 */
export async function clearAll(): Promise<void> {
  await Promise.all([
    clearStore(STORES.PATIENTS),
    clearStore(STORES.SESSIONS),
    clearStore(STORES.ALERTS),
    clearStore(STORES.ADMINISTRATIONS),
  ]);
}
