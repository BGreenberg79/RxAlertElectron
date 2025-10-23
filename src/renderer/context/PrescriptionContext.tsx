import React, { createContext, useState, useEffect } from "react";

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  quantity: number;
  taken: number;
  rxcui?: string | null;
}

interface ContextProps {
  prescriptions: Prescription[];
  addPrescription: (p: Prescription) => Promise<void>;
  markTaken: (id: string) => void;
  removePrescription: (id: string) => Promise<void>;
  refillPrescription: (id: string, newQuantity: number) => Promise<void>;
}

export const PrescriptionContext = createContext<ContextProps>(null!);

// Check if we're in Electron or web
const isElectron = typeof window !== 'undefined' && typeof (window as any).rxAlert !== 'undefined';

console.log("Running in:", isElectron ? "ELECTRON" : "WEB");

export const PrescriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    (async () => {
      try {
        if (isElectron) {
          const saved = await (window as any).rxAlert.loadPrescriptions();
          console.log("Loaded prescriptions from Electron:", saved);
          setPrescriptions(saved);
        } else {
          // Web version: use localStorage
          const saved = localStorage.getItem('prescriptions');
          if (saved) {
            console.log("Loaded prescriptions from localStorage:", saved);
            setPrescriptions(JSON.parse(saved));
          }
        }
      } catch (error) {
        console.error("Error loading prescriptions:", error);
      }
    })();
  }, []);

  const persist = async (data: Prescription[]) => {
    console.log("Persisting prescriptions:", data);
    
    try {
      if (isElectron) {
        await (window as any).rxAlert.savePrescriptions(data);
      } else {
        // Web version: use localStorage
        localStorage.setItem('prescriptions', JSON.stringify(data));
      }
      setPrescriptions(data);
    } catch (error) {
      console.error("Error persisting prescriptions:", error);
    }
  };

  const addPrescription = async (p: Prescription) => {
    const updated = [...prescriptions, p];
    await persist(updated);
  };

  const removePrescription = async (id: string) => {
    const updated = prescriptions.filter(p => p.id !== id);
    await persist(updated);
  };

  const refillPrescription = async (id: string, newQuantity: number) => {
    const updated = prescriptions.map(p =>
      p.id === id
        ? { ...p, quantity: newQuantity, taken: 0 }
        : p
    );
    await persist(updated);
    alert("Prescription refilled successfully!");
  };

  const markTaken = async (id: string) => {
    // First, check current state BEFORE updating
    const prescription = prescriptions.find(p => p.id === id);
    if (!prescription) {
      console.error("Prescription not found:", id);
      return;
    }
    
    const newTakenCount = prescription.taken + 1;
    const remainingAfterTaking = prescription.quantity - newTakenCount;

    console.log(`📊 Taking pill for: ${prescription.name}`);
    console.log(`   Taken before: ${prescription.taken}, After: ${newTakenCount}`);
    console.log(`   Quantity: ${prescription.quantity}, Remaining: ${remainingAfterTaking}`);

    // Now update the prescriptions
    const updated = prescriptions.map(p =>
      p.id === id
        ? { ...p, taken: newTakenCount }
        : p
    );

    // Persist first
    await persist(updated);

    // Send alert/notification if 7 or fewer pills remain
    if (remainingAfterTaking <= 7 && remainingAfterTaking > 0) {
      const message = `⚠️ Low Supply Alert!\n\nOnly ${remainingAfterTaking} pill${remainingAfterTaking !== 1 ? 's' : ''} left of ${prescription.name}.\n\nPlease contact your pharmacy or physician to refill.`;
      
      console.log(`🔔 Triggering alert: ${remainingAfterTaking} pills remaining`);
      alert(message);
      
      // Also try native notification if available
      if (isElectron) {
        try {
          await (window as any).rxAlert.notifyLowSupply(prescription.name);
          console.log("✅ Electron notification also sent");
        } catch (error) {
          console.error("❌ Error sending Electron notification:", error);
        }
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Low Supply Alert', {
          body: `Only ${remainingAfterTaking} pills left of ${prescription.name}. Please refill.`,
        });
        console.log("✅ Web notification also sent");
      }
    }
  };

  return (
    <PrescriptionContext.Provider value={{ prescriptions, addPrescription, markTaken, removePrescription, refillPrescription }}>
      {children}
    </PrescriptionContext.Provider>
  );
};