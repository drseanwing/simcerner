import { useState } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 6,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9998,
        fontSize: 12,
        maxWidth: 280,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Install PowerChart</div>
      <div style={{ marginBottom: 10, color: '#555' }}>
        Install this app for offline access to patient simulation data.
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => setDismissed(true)}>
          Not now
        </button>
        <button className="btn btn-primary" onClick={() => promptInstall()}>
          Install
        </button>
      </div>
    </div>
  )
}
