import { useContext, useState } from "react";
import { PrescriptionContext } from "../context/PrescriptionContext";

export default function Tracker() {
  const { prescriptions, markTaken, removePrescription, refillPrescription } = useContext(PrescriptionContext);
  const [refillId, setRefillId] = useState<string | null>(null);
  const [refillQuantity, setRefillQuantity] = useState(30);

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

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 opacity-30">📭</div>
        <p className="text-gray-500 text-lg">No prescriptions added yet.</p>
        <p className="text-gray-400 text-sm mt-2">Add your first medication using the form on the left</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {prescriptions.map(p => {
        const remaining = p.quantity - p.taken;
        const isRefilling = refillId === p.id;
        const isLowSupply = remaining <= 7;
        const percentRemaining = (remaining / p.quantity) * 100;
        
        return (
          <div 
            key={p.id} 
            className={`border-2 ${isLowSupply ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Dosage:</span> {p.dosage}
                </p>
                {p.instructions && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Instructions:</span> {p.instructions}
                  </p>
                )}
              </div>
              <button 
                onClick={() => {
                  if (confirm(`Remove ${p.name}?`)) {
                    removePrescription(p.id);
                  }
                }}
                className="ml-3 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
              >
                🗑️ Remove
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className={isLowSupply ? "text-red-700" : "text-green-700"}>
                  {remaining} pills remaining
                </span>
                <span className="text-gray-500">
                  {p.taken} / {p.quantity} taken
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isLowSupply ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${percentRemaining}%` }}
                ></div>
              </div>
            </div>

            {isLowSupply && (
              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Low supply! Consider refilling soon.
                </p>
              </div>
            )}

            {isRefilling ? (
              <form onSubmit={handleRefillSubmit} className="space-y-3 animate-fadeIn">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(Number(e.target.value))}
                    min={1}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="New bottle quantity"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    ✓ Confirm
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRefillId(null)}
                    className="px-5 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    ✕ Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  💡 This will reset taken count to 0 and set new supply to {refillQuantity} pills.
                </p>
              </form>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => markTaken(p.id)}
                  disabled={remaining <= 0}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                >
                  💊 Take Pill
                </button>
                <button 
                  onClick={() => handleRefillClick(p.id, p.quantity)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  🔄 Refill
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}