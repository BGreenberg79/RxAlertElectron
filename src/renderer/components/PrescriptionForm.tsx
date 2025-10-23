import { useContext, useEffect, useState } from "react";
import { PrescriptionContext } from "../context/PrescriptionContext";

type Item = { displayName: string; strengths: string[]; rxcuisByIndex: string[] };

// Check if we're in Electron or web
const isElectron = typeof window !== 'undefined' && window.rxAlert !== undefined;

// Web API version using proxy server
const webSearchRxTerms = async (term: string) => {
  try {
    const response = await fetch(`http://localhost:3001/api/rxterms/search?terms=${encodeURIComponent(term)}`);
    if (!response.ok) {
      throw new Error('Proxy server error');
    }
    return await response.json();
  } catch (error) {
    console.error("Web API error - is proxy server running?", error);
    // Fallback to mock data if proxy isn't available
    console.warn("Falling back to mock data");
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      total: 3,
      items: [
        {
          displayName: `${term} (Mock - Start proxy server)`,
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
        
        console.log("Search results:", res);
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
      
      console.log("Adding prescription:", newRx);
      await addPrescription(newRx);

      // Reset form
      setTerm("");
      setResults([]);
      setSelectedIndex(null);
      setStrengthIndex(null);
      setInstructions("");
      setQuantity(30);
      
      alert("Prescription added successfully!");
    } catch (error) {
      console.error("Error adding prescription:", error);
      alert("Failed to add prescription. Check console for details.");
    }
  }

  return (
    <form onSubmit={handleAdd} className="p-4 border rounded space-y-2">
      {!isElectron && (
        <div className="p-2 bg-blue-100 border border-blue-400 rounded text-sm mb-3">
          ℹ️ Web mode: Using proxy server for real NIH data. Run <code className="bg-white px-1">node proxy-server.js</code> first.
        </div>
      )}
      
      <div>
        <input
          type="text"
          placeholder="Search brand or generic (e.g., amoxicillin or Lipitor)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {loading && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
      </div>

      {results.length > 0 && (
        <div>
          <select
            value={selectedIndex ?? ""}
            onChange={(e) => { 
              setSelectedIndex(e.target.value === "" ? null : Number(e.target.value)); 
              setStrengthIndex(null); 
            }}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a drug</option>
            {results.map((it, i) => (
              <option key={i} value={i}>{it.displayName}</option>
            ))}
          </select>
        </div>
      )}

      {chosen && strengths.length > 0 && (
        <div>
          <select
            value={strengthIndex ?? ""}
            onChange={(e) => setStrengthIndex(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select strength / form</option>
            {strengths.map((s, i) => (
              <option key={i} value={i}>{s.trim()}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Instructions (e.g., 1 tab PO BID)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <input
          type="number"
          placeholder="Quantity (e.g., 30)"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min={1}
          className="w-full p-2 border rounded"
        />
      </div>

      <button 
        type="submit" 
        disabled={!chosen || strengthIndex == null}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
      >
        Add Prescription
      </button>
    </form>
  );
}