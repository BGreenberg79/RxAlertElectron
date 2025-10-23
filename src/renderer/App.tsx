import { PrescriptionProvider } from "./context/PrescriptionContext";
import PrescriptionForm from "./components/PrescriptionForm";
import Tracker from "./components/Tracker";

export default function App() {
  return (
    <PrescriptionProvider>
      <div className="p-4">
        <h1>RxAlert</h1>
        <PrescriptionForm />
        <Tracker />
      </div>
    </PrescriptionProvider>
  );    
}
