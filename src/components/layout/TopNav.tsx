import { useNavigate } from 'react-router-dom'

export function TopNav() {
  const navigate = useNavigate()

  return (
    <div className="top-nav">
      <div className="top-nav-item">Task</div>
      <div className="top-nav-item">Edit</div>
      <div className="top-nav-item">View</div>
      <div className="top-nav-item" onClick={() => navigate('/')}>Patient</div>
      <div className="top-nav-item">Chart</div>
      <div className="top-nav-item">Notifications</div>
      <div className="top-nav-item">Options</div>
      <div className="top-nav-item">Help</div>
    </div>
  )
}
