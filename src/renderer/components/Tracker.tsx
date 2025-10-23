import { useContext, useState } from "react";
import { PrescriptionContext } from "../context/PrescriptionContext";

export default function Tracker() {
  const { prescriptions, markTaken, removePrescription, refillPrescription } = useContext(PrescriptionContext);
  const [refillId, setRefillId] = useState<string | null>(null);
  const [refillQuantity, setRefillQuantity] = useState(30);

  console.log("Current prescriptions in tracker:", prescriptions);

  const handleRefillClick = (id: string, currentQuantity: number) => {
    setRefillId(id);
    setRefillQuantity(currentQuantity);
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refillId && refillQuantity > 0) {
      await refillPrescription(refillId, refillQuantity);
      setRefillId(null);
      setRefillQuantity(30);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-3">Your Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <p className="text-gray-500">No prescriptions added yet.</p>
      ) : (
        prescriptions.map(p => {
          const remaining = p.quantity - p.taken;
          const isRefilling = refillId === p.id;
          
          return (
            <div key={p.id} className="border p-3 mb-2 rounded bg-white shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-600">{p.dosage}</p>
                  {p.instructions && <p className="text-sm">{p.instructions}</p>}
                  <p className="mt-2">
                    <span className={remaining <= 7 ? "text-red-600 font-bold" : "text-green-600"}>
                      Remaining: {remaining} / {p.quantity}
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm(`Remove ${p.name}?`)) {
                      removePrescription(p.id);
                    }
                  }}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Remove
                </button>
              </div>

              {isRefilling ? (
                <form onSubmit={handleRefillSubmit} className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={refillQuantity}
                      onChange={(e) => setRefillQuantity(Number(e.target.value))}
                      min={1}
                      className="flex-1 p-2 border rounded"
                      placeholder="New bottle quantity"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Confirm
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRefillId(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This will reset the pill count to 0 taken and set the bottle to {refillQuantity} pills.
                  </p>
                </form>
              ) : (
                <div className="mt-2 flex gap-2">
                  <button 
                    onClick={() => markTaken(p.id)}
                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={remaining <= 0}
                  >
                    Take Pill
                  </button>
                  <button 
                    onClick={() => handleRefillClick(p.id, p.quantity)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Refill
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}