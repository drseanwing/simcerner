import type { Patient, FluidBalanceEntryFlat } from '@/types/patient'

interface FluidBalanceViewProps {
  patient: Patient
}

function isFlatEntry(
  entry: Patient['fluidBalance'][number],
): entry is FluidBalanceEntryFlat {
  return 'intake_oral' in entry
}

export function FluidBalanceView({ patient }: FluidBalanceViewProps) {
  const calculateTotals = () => {
    if (!patient.fluidBalance || patient.fluidBalance.length === 0) {
      return { totalIntake: 0, totalOutput: 0, balance: 0 }
    }
    const totalIntake = patient.fluidBalance.reduce((sum, e) => {
      if (isFlatEntry(e)) {
        return sum + e.intake_oral + e.intake_iv
      }
      return sum + e.intake
    }, 0)
    const totalOutput = patient.fluidBalance.reduce((sum, e) => {
      if (isFlatEntry(e)) {
        return sum + e.output_urine + e.output_other
      }
      return sum + e.output
    }, 0)
    return { totalIntake, totalOutput, balance: totalIntake - totalOutput }
  }

  const { totalIntake, totalOutput, balance } = calculateTotals()

  return (
    <>
      <div className="content-header">
        {'\uD83D\uDCA7'} Fluid Balance
      </div>
      <div className="content-body">
        <div className="fluid-summary">
          <div className="fluid-card positive">
            <div className="fluid-card-label">Total Intake (24h)</div>
            <div className="fluid-card-value">
              {totalIntake}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
          <div className="fluid-card negative">
            <div className="fluid-card-label">Total Output (24h)</div>
            <div className="fluid-card-value">
              {totalOutput}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
          <div
            className={`fluid-card ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral'}`}
          >
            <div className="fluid-card-label">Net Balance (24h)</div>
            <div className="fluid-card-value">
              {balance > 0 ? '+' : ''}
              {balance}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
        </div>
        <div className="vitals-chart">
          <div className="chart-header">Fluid Balance Record</div>
          {patient.fluidBalance && patient.fluidBalance.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Oral Intake (mL)</th>
                  <th>IV Intake (mL)</th>
                  <th>Total Intake (mL)</th>
                  <th>Urine Output (mL)</th>
                  <th>Other Output (mL)</th>
                  <th>Total Output (mL)</th>
                  <th>Balance (mL)</th>
                </tr>
              </thead>
              <tbody>
                {patient.fluidBalance.map((entry, idx) => {
                  if (isFlatEntry(entry)) {
                    const intake = entry.intake_oral + entry.intake_iv
                    const output = entry.output_urine + entry.output_other
                    const entryBalance = intake - output
                    return (
                      <tr key={idx}>
                        <td>{entry.datetime}</td>
                        <td>{entry.intake_oral}</td>
                        <td>{entry.intake_iv}</td>
                        <td style={{ fontWeight: '600' }}>{intake}</td>
                        <td>{entry.output_urine}</td>
                        <td>{entry.output_other}</td>
                        <td style={{ fontWeight: '600' }}>{output}</td>
                        <td
                          className={
                            entryBalance > 0
                              ? 'text-success'
                              : entryBalance < 0
                                ? 'text-danger'
                                : ''
                          }
                        >
                          {entryBalance > 0 ? '+' : ''}
                          {entryBalance}
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={idx}>
                      <td>{entry.datetime}</td>
                      <td>-</td>
                      <td>-</td>
                      <td style={{ fontWeight: '600' }}>{entry.intake}</td>
                      <td>-</td>
                      <td>-</td>
                      <td style={{ fontWeight: '600' }}>{entry.output}</td>
                      <td
                        className={
                          entry.balance > 0
                            ? 'text-success'
                            : entry.balance < 0
                              ? 'text-danger'
                              : ''
                        }
                      >
                        {entry.balance > 0 ? '+' : ''}
                        {entry.balance}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div
              className="text-muted"
              style={{ padding: '20px', textAlign: 'center' }}
            >
              No fluid balance data recorded
            </div>
          )}
        </div>
      </div>
    </>
  )
}
