/**
 * @file OrdersView.tsx
 * @description Orders view migrated from emr-sim-v2.html.
 *
 * Displays:
 * - Add New Order section with Autocomplete for test search
 * - Priority selector (Routine, Urgent, STAT)
 * - Add Order button
 * - Current Orders table with Sign action for unsigned orders
 *
 * Uses patientStore for adding/signing orders and the LAB_TESTS constant
 * for autocomplete suggestions.
 */

import { useState, useCallback } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import Autocomplete from '../common/Autocomplete';
import { LAB_TESTS } from '../../services/labTests';
import type { Order, OrderPriority, OrderType } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * OrdersView provides order entry and management for the current patient.
 * Allows searching for tests, adding orders, and signing unsigned orders.
 */
export default function OrdersView() {
  const patient = usePatientStore((s) => s.currentPatient);
  const addOrder = usePatientStore((s) => s.addOrder);
  const signOrder = usePatientStore((s) => s.signOrder);

  const [searchQuery, setSearchQuery] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Laboratory');
  const [priority, setPriority] = useState<OrderPriority>('Routine');

  /** Handle test selection from the autocomplete dropdown. */
  const handleSelectTest = useCallback(
    (item: Record<string, unknown>) => {
      setOrderName(String(item.name));
      setOrderType((item.category as OrderType) ?? 'Laboratory');
      setSearchQuery(String(item.name));
    },
    [],
  );

  /** Add a new order to the patient record. */
  const handleAddOrder = useCallback(() => {
    if (!patient || !orderName.trim()) return;

    const order: Order = {
      id: `ORD${String((patient.orders.length + 1)).padStart(3, '0')}`,
      type: orderType,
      name: orderName,
      status: 'Ordered',
      ordered: new Date().toISOString(),
      priority,
    };

    addOrder(patient.mrn, order);
    setOrderName('');
    setSearchQuery('');
    setPriority('Routine');
  }, [patient, orderName, orderType, priority, addOrder]);

  /** Sign an unsigned order. */
  const handleSignOrder = useCallback(
    (orderId: string) => {
      if (!patient) return;
      signOrder(patient.mrn, orderId);
    },
    [patient, signOrder],
  );

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  return (
    <>
      <div className="content-header">Orders</div>
      <div className="content-tabs">
        <div className="content-tab active">Document in Plan</div>
        <div className="content-tab">Manage Infusions</div>
      </div>
      <div className="content-body">
        {/* Add New Order */}
        <div className="order-entry">
          <h3 style={{ marginBottom: 15, fontSize: 13 }}>Add New Order</h3>

          <div className="form-group">
            <label className="form-label">Search for test or procedure:</label>
            <Autocomplete
              value={searchQuery}
              onChange={setSearchQuery}
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
              value={priority}
              onChange={(e) => setPriority(e.target.value as OrderPriority)}
            >
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAddOrder}
            disabled={!orderName.trim()}
          >
            Add Order
          </button>
        </div>

        {/* Current Orders */}
        <div className="mt-10">
          <h3 style={{ marginBottom: 10, fontSize: 13 }}>Current Orders</h3>
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
                    <td style={{ fontWeight: 600 }}>{order.name}</td>
                    <td>
                      {order.signed ? (
                        <span className="text-success">✓ {order.status}</span>
                      ) : (
                        <span className="text-warning">⚠ {order.status}</span>
                      )}
                    </td>
                    <td>{order.ordered}</td>
                    <td>
                      {!order.signed && (
                        <button
                          className="btn btn-primary btn-sm"
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
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
              No orders placed
            </div>
          )}
        </div>
      </div>
    </>
  );
}
