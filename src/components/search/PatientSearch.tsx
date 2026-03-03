/**
 * @file PatientSearch.tsx
 * @description Patient search screen allowing clinicians to find and select a patient.
 *
 * Migrated from the patient search workflow in emr-sim-v2.html. Provides a
 * text input to filter patients by name or MRN and a results list. Selecting
 * a patient sets it as the current patient in the patient store and navigates
 * to the doctor-view via the session store.
 */

import { useMemo } from 'react';
import type { Patient } from '../../types';
import { usePatientStore } from '../../stores/patientStore';
import { useSessionStore } from '../../stores/sessionStore';
import '../../styles/components/layout.css';

/**
 * PatientSearch renders the full-screen patient search view. It filters the
 * patient roster from the patient store based on the search query in the
 * session store, and navigates to the chart on selection.
 */
export default function PatientSearch() {
  const patients = usePatientStore((s) => s.patients);
  const setCurrentPatient = usePatientStore((s) => s.setCurrentPatient);
  const searchQuery = useSessionStore((s) => s.searchQuery);
  const setSearchQuery = useSessionStore((s) => s.setSearchQuery);
  const setCurrentView = useSessionStore((s) => s.setCurrentView);

  /** Filter patients by name or MRN against the current search query. */
  const filteredPatients = useMemo<Patient[]>(() => {
    const all = Object.values(patients);
    if (!searchQuery.trim()) return all;

    const query = searchQuery.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query),
    );
  }, [patients, searchQuery]);

  /** Handle patient selection — sets current patient and switches to doctor view. */
  const handleSelect = (patient: Patient) => {
    setCurrentPatient(patient);
    setCurrentView('doctor-view');
  };

  return (
    <div className="patient-search">
      <h1 className="patient-search-title">Patient Search</h1>

      <input
        className="search-input"
        type="text"
        placeholder="Search by patient name or MRN..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />

      <div className="patient-list">
        {filteredPatients.length === 0 ? (
          <div className="patient-search-empty">
            {Object.keys(patients).length === 0
              ? 'Loading patients...'
              : 'No patients match your search.'}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.mrn}
              className="patient-list-item"
              onClick={() => handleSelect(patient)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(patient);
                }
              }}
            >
              <div>
                <div className="patient-list-item-name">{patient.name}</div>
                <div className="patient-list-item-detail">
                  MRN: {patient.mrn} | {patient.location}
                </div>
              </div>
              <div className="patient-list-item-detail">
                DOB: {patient.dob} | Age: {patient.age}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
