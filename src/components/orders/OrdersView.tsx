import type { Patient } from '@/types/patient'
import { usePatientStore } from '@/stores/patientStore'
import { useSessionStore } from '@/stores/sessionStore'
import { Autocomplete } from '@/components/common/Autocomplete'
import type { AutocompleteItem } from '@/components/common/Autocomplete'

const LAB_TESTS: AutocompleteItem[] = [
  // Haematology
  { name: 'Full Blood Count (FBC)', type: 'Haematology', category: 'Laboratory' },
  { name: 'Coagulation Profile', type: 'Haematology', category: 'Laboratory' },
  { name: 'INR', type: 'Haematology', category: 'Laboratory' },

  // Biochemistry
  { name: 'Liver Function Test (LFT)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Urea Electrolytes Creatinine (UEC)', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Calcium', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Magnesium', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Phosphate', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'Troponin', type: 'Biochemistry', category: 'Laboratory' },
  { name: 'CK', type: 'Biochemistry', category: 'Laboratory' },

  // Toxicology
  { name: 'Paracetamol Level', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Serum Ethanol', type: 'Toxicology', category: 'Laboratory' },
  { name: 'Serum Digoxin', type: 'Toxicology', category: 'Laboratory' },

  // Blood Gas
  { name: 'Venous Blood Gas', type: 'Blood Gas', category: 'Laboratory' },
  { name: 'Arterial Blood Gas', type: 'Blood Gas', category: 'Laboratory' },

  // Vitamins
  { name: 'Vitamin D', type: 'Vitamins', category: 'Laboratory' },
  { name: 'B12 and Folate', type: 'Vitamins', category: 'Laboratory' },
  { name: 'Iron Studies', type: 'Vitamins', category: 'Laboratory' },

  // Microbiology
  { name: 'Rapid PCR (COVID, Influenza, RSV)', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Respiratory Virus PCR', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Urine MCS', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Blood Culture', type: 'Microbiology', category: 'Laboratory' },
  { name: 'Wound Swab MCS', type: 'Microbiology', category: 'Laboratory' },
]

interface OrdersViewProps {
  patient: Patient
}

export function OrdersView({ patient }: OrdersViewProps) {
  const addOrder = usePatientStore((s) => s.addOrder)
  const signOrder = usePatientStore((s) => s.signOrder)
  const orderSearchQuery = useSessionStore((s) => s.orderSearchQuery)
  const setOrderSearchQuery = useSessionStore((s) => s.setOrderSearchQuery)
  const newOrder = useSessionStore((s) => s.newOrder)
  const setNewOrder = useSessionStore((s) => s.setNewOrder)
  const resetNewOrder = useSessionStore((s) => s.resetNewOrder)

  const handleSelectTest = (test: AutocompleteItem) => {
    setNewOrder({
      ...newOrder,
      type: test.category ?? 'Laboratory',
      name: test.name,
    })
    setOrderSearchQuery(test.name)
  }

  const handleAddOrder = () => {
    if (!newOrder.name) {
      alert('Please specify order details')
      return
    }

    const order = {
      id: `ORD${String(patient.orders.length + 1).padStart(3, '0')}`,
      type: newOrder.type,
      name: newOrder.name,
      status: 'Pending Signature',
      ordered: new Date().toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      signed: false,
      priority: newOrder.priority,
    }

    addOrder(order)
    resetNewOrder()
    alert('Order added successfully')
  }

  const handleSignOrder = (orderId: string) => {
    signOrder(orderId)
    alert('Order signed successfully')
  }

  return (
    <>
      <div className="content-header">{'\uD83D\uDCCB'} Orders</div>
      <div className="content-tabs">
        <div className="content-tab active">Document in Plan</div>
        <div className="content-tab">Manage Infusions</div>
      </div>
      <div className="content-body">
        <div className="order-entry">
          <h3 style={{ marginBottom: '15px', fontSize: '13px' }}>
            Add New Order
          </h3>
          <div className="form-group">
            <label className="form-label">Search for test or procedure:</label>
            <Autocomplete
              value={orderSearchQuery}
              onChange={setOrderSearchQuery}
              onSelect={handleSelectTest}
              placeholder="Type to search... (e.g., 'FBC', 'UEC', 'Troponin')"
              items={LAB_TESTS}
              filterKey="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Priority:</label>
            <select
              className="form-control"
              value={newOrder.priority}
              onChange={(e) =>
                setNewOrder({ ...newOrder, priority: e.target.value })
              }
            >
              <option>Routine</option>
              <option>Urgent</option>
              <option>STAT</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAddOrder}
            disabled={!newOrder.name}
          >
            Add Order
          </button>
        </div>
        <div className="mt-10">
          <h3 style={{ marginBottom: '10px', fontSize: '13px' }}>
            Current Orders
          </h3>
          {patient.orders.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Order Name</th>
                  <th>Status</th>
                  <th>Ordered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patient.orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.type}</td>
                    <td style={{ fontWeight: '600' }}>{order.name}</td>
                    <td>
                      {order.signed ? (
                        <span className="text-success">
                          {'\u2713'} {order.status}
                        </span>
                      ) : (
                        <span className="text-warning">
                          {'\u26A0'} {order.status}
                        </span>
                      )}
                    </td>
                    <td>{order.ordered}</td>
                    <td>
                      {!order.signed && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSignOrder(order.id)}
                        >
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className="text-muted"
              style={{ padding: '20px', textAlign: 'center' }}
            >
              No orders placed
            </div>
          )}
        </div>
      </div>
    </>
  )
}
