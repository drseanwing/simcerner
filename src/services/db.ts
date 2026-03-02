import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Patient } from '@/types/patient'

interface SimCernerDB extends DBSchema {
  patients: {
    key: string
    value: Patient
    indexes: { 'by-name': string }
  }
  sessionLog: {
    key: number
    value: {
      timestamp: number
      action: string
      detail: string
    }
  }
}

const DB_NAME = 'simcerner'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<SimCernerDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SimCernerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const patientStore = db.createObjectStore('patients', { keyPath: 'mrn' })
        patientStore.createIndex('by-name', 'name')

        db.createObjectStore('sessionLog', {
          keyPath: 'timestamp',
        })
      },
    })
  }
  return dbPromise
}

export async function savePatient(patient: Patient): Promise<void> {
  const db = await getDB()
  await db.put('patients', patient)
}

export async function saveAllPatients(patients: Patient[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('patients', 'readwrite')
  await Promise.all([...patients.map((p) => tx.store.put(p)), tx.done])
}

export async function getPatient(mrn: string): Promise<Patient | undefined> {
  const db = await getDB()
  return db.get('patients', mrn)
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDB()
  return db.getAll('patients')
}

export async function logAction(action: string, detail: string): Promise<void> {
  const db = await getDB()
  await db.add('sessionLog', {
    timestamp: Date.now(),
    action,
    detail,
  })
}
