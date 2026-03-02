import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#d9534f',
        color: 'white',
        padding: '8px 20px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      Offline — using cached data
    </div>
  )
}
