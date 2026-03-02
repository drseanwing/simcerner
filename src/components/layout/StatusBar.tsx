export function StatusBar() {
  return (
    <div className="status-bar">
      <div>
        P0239 WINGS 31 December 2025{' '}
        {new Date().toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <div>EMR Simulation - Training Mode</div>
    </div>
  )
}
