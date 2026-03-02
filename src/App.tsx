import { Routes, Route, Navigate } from 'react-router-dom'
import { usePatientStore } from '@/stores/patientStore'
import { PatientSearch } from '@/components/search/PatientSearch'
import { TopNav } from '@/components/layout/TopNav'
import { PatientBanner } from '@/components/layout/PatientBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { DoctorView } from '@/components/doctor-view/DoctorView'
import { VitalsView } from '@/components/deterioration/VitalsView'
import { VitalsGraphView } from '@/components/vitals-graph/VitalsGraphView'
import { FluidBalanceView } from '@/components/fluid-balance/FluidBalanceView'
import { MARView } from '@/components/mar/MARView'
import { OrdersView } from '@/components/orders/OrdersView'
import { ResultsView } from '@/components/results/ResultsView'
import { DocumentationView } from '@/components/documentation/DocumentationView'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { InstallPrompt } from '@/components/common/InstallPrompt'

function ChartLayout() {
  const currentPatient = usePatientStore((s) => s.currentPatient)

  if (!currentPatient) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <TopNav />
      <PatientBanner patient={currentPatient} />
      <div className="main-container">
        <Sidebar />
        <div className="content-area">
          <Routes>
            <Route path="doctor-view" element={<DoctorView patient={currentPatient} />} />
            <Route path="vitals" element={<VitalsView patient={currentPatient} />} />
            <Route path="vitals-graph" element={<VitalsGraphView patient={currentPatient} />} />
            <Route
              path="fluid-balance"
              element={<FluidBalanceView patient={currentPatient} />}
            />
            <Route path="mar" element={<MARView patient={currentPatient} />} />
            <Route path="orders" element={<OrdersView patient={currentPatient} />} />
            <Route path="results" element={<ResultsView patient={currentPatient} />} />
            <Route
              path="documentation"
              element={<DocumentationView patient={currentPatient} />}
            />
            <Route path="*" element={<Navigate to="doctor-view" replace />} />
          </Routes>
        </div>
      </div>
      <StatusBar />
    </>
  )
}

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PatientSearch />} />
        <Route path="/chart/*" element={<ChartLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <OfflineIndicator />
      <InstallPrompt />
    </>
  )
}
