import type { Patient } from '@/types/patient'

interface ResultsViewProps {
  patient: Patient
}

export function ResultsView({ patient }: ResultsViewProps) {
  return (
    <>
      <div className="content-header">{'\uD83D\uDD2C'} Results</div>
      <div className="content-tabs">
        <div className="content-tab active">Lab - Recent</div>
        <div className="content-tab">Lab - Extended</div>
        <div className="content-tab">Medical Imaging</div>
      </div>
      <div className="content-body">
        <div className="vitals-chart mb-10">
          <div className="chart-header">Haematology</div>
          {patient.results.haematology.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {patient.results.haematology.map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.test}</td>
                    <td className={result.flag ? 'text-danger' : ''}>
                      {result.value}
                    </td>
                    <td>{result.unit}</td>
                    <td>{result.range}</td>
                    <td className="text-danger">{result.flag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted" style={{ padding: '10px' }}>
              No results available
            </div>
          )}
        </div>
        <div className="vitals-chart">
          <div className="chart-header">Biochemistry</div>
          {patient.results.biochemistry.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {patient.results.biochemistry.map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.test}</td>
                    <td className={result.flag ? 'text-danger' : ''}>
                      {result.value}
                    </td>
                    <td>{result.unit}</td>
                    <td>{result.range}</td>
                    <td className="text-danger">{result.flag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted" style={{ padding: '10px' }}>
              No results available
            </div>
          )}
        </div>
      </div>
    </>
  )
}
