import { useContext, useEffect, useState } from "react";
import { PrescriptionContext } from "../context/PrescriptionContext";

type Item = { displayName: string; strengths: string[]; rxcuisByIndex: string[] };

const isElectron = typeof window !== 'undefined' && window.rxAlert !== undefined;

const webSearchRxTerms = async (term: string) => {
  try {
    // Use Vercel serverless function
    const response = await fetch(`/api/rxterms?terms=${encodeURIComponent(term)}`);
    if (!response.ok) {
      throw new Error('API error');
    }
    return await response.json();
  } catch (error) {
    console.error("Web API error:", error);
    // Fallback to mock data
    return {
      total: 1,
      items: [
        {
          displayName: `${term} (Error - Check connection)`,
          strengths: ["10 mg tablet", "20 mg tablet"],
          rxcuisByIndex: ["mock1", "mock2"]
        }
      ]
    };
  }
};
export default function PrescriptionForm() {
  const { addPrescription } = useContext(PrescriptionContext);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [strengthIndex, setStrengthIndex] = useState<number | null>(null);
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!term.trim()) { 
        setResults([]); 
        setSelectedIndex(null); 
        setStrengthIndex(null);
        return; 
      }
      
      setLoading(true);
      try {
        const res = isElectron 
          ? await window.rxAlert.searchRxTerms(term.trim())
          : await webSearchRxTerms(term.trim());
        
        setResults(res.items ?? []);
        setSelectedIndex(null);
        setStrengthIndex(null);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

  const chosen = selectedIndex != null ? results[selectedIndex] : null;
  const strengths = chosen?.strengths ?? [];
  const rxcuiForStrength = (idx: number | null) =>
    idx != null && chosen?.rxcuisByIndex?.[idx] ? chosen.rxcuisByIndex[idx] : null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    
    if (!chosen || strengthIndex == null) {
      alert("Please select a drug and strength from the dropdown menus.");
      return;
    }

    const rxcui = rxcuiForStrength(strengthIndex);
    
    try {
      const newRx = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${chosen.displayName} ${strengths[strengthIndex]}`,
        dosage: strengths[strengthIndex],
        instructions,
        quantity,
        taken: 0,
        rxcui
      };
      
      await addPrescription(newRx);

      setTerm("");
      setResults([]);
      setSelectedIndex(null);
      setStrengthIndex(null);
      setInstructions("");
      setQuantity(30);
      
      alert("✅ Prescription added successfully!");
    } catch (error) {
      console.error("Error adding prescription:", error);
      alert("❌ Failed to add prescription. Check console for details.");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-5">
      {!isElectron && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          {/* <p className="text-blue-800">
            ℹ️ <strong>Web mode:</strong> Make sure proxy server is running (<code className="bg-white px-2 py-0.5 rounded">node proxy-server.js</code>)
          </p> */}
        </div>
      )}

      {/* Search Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          🔍 Search Medication
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g., amoxicillin, Lipitor, aspirin..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 placeholder-gray-400"
          />
          {loading && (
            <div className="absolute right-4 top-3.5">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {loading && (
          <p className="text-sm text-blue-600 mt-2 animate-pulse font-medium">
            Searching NIH database...
          </p>
        )}
      </div>

      {/* Drug Selection */}
      {results.length > 0 && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            💊 Select Drug
          </label>
          <select
            value={selectedIndex ?? ""}
            onChange={(e) => { 
              setSelectedIndex(e.target.value === "" ? null : Number(e.target.value)); 
              setStrengthIndex(null); 
            }}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 bg-white cursor-pointer"
            required
          >
            <option value="">-- Choose a medication --</option>
            {results.map((it, i) => (
              <option key={i} value={i}>{it.displayName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Strength Selection */}
      {chosen && strengths.length > 0 && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            ⚖️ Select Strength / Form
          </label>
          <select
            value={strengthIndex ?? ""}
            onChange={(e) => setStrengthIndex(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 bg-white cursor-pointer"
            required
          >
            <option value="">-- Choose strength/form --</option>
            {strengths.map((s, i) => (
              <option key={i} value={i}>{s.trim()}</option>
            ))}
          </select>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          📝 Instructions (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1 tab PO BID, Take with food"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          🔢 Quantity
        </label>
        <input
          type="number"
          placeholder="30"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min={1}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
        />
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={!chosen || strengthIndex == null}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none text-lg"
      >
        {!chosen || strengthIndex == null ? "Select medication above" : "Add Prescription"}
      </button>
    </form>
  );
}