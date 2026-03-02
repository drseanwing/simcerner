import { useNavigate, useLocation } from 'react-router-dom'

interface MenuItem {
  id: string
  label: string
  section: string
}

const menuItems: MenuItem[] = [
  { id: 'doctor-view', label: 'Doctor View', section: 'Menu' },
  { id: 'vitals', label: 'Managing Deterioration', section: 'Menu' },
  { id: 'vitals-graph', label: 'Vitals - Graphical', section: 'Menu' },
  { id: 'fluid-balance', label: 'Fluid Balance', section: 'Menu' },
  { id: 'orders', label: 'Orders', section: 'Menu' },
  { id: 'results', label: 'Results', section: 'Menu' },
  { id: 'documentation', label: 'Documentation', section: 'Menu' },
  { id: 'mar', label: 'MAR', section: 'Menu' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const sections: Record<string, MenuItem[]> = {}
  menuItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = []
    sections[item.section].push(item)
  })

  const currentView = location.pathname.split('/chart/')[1] ?? ''

  return (
    <div className="sidebar">
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="sidebar-section">
          <div className="sidebar-header">{'\u25BC'} {section}</div>
          {items.map((item) => (
            <div
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => navigate(`/chart/${item.id}`)}
            >
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
