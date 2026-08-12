"use client";

import { selectStore } from "@/app/actions/auth";
import { Store, Droplet, Lock, X } from "lucide-react";
import { useState } from "react";

export default function StoreSelectPage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  // State for PIN modal
  const [activeStorePrompt, setActiveStorePrompt] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectClick = (storeId: string) => {
    setActiveStorePrompt(storeId);
    setPinInput("");
    setErrorMsg("");
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStorePrompt) return;

    // PIN Verification
    if (activeStorePrompt === "karya_bahan" && pinInput.toLowerCase() !== "jayaplavon") {
      setErrorMsg("Password salah!");
      return;
    }
    if (activeStorePrompt === "bysca" && pinInput !== "997992") {
      setErrorMsg("Password salah!");
      return;
    }

    // Success
    setLoading(activeStorePrompt);
    await selectStore(activeStorePrompt);
  };

  const closeModal = () => {
    setActiveStorePrompt(null);
    setPinInput("");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 absolute inset-0 z-50">
      <div className="max-w-2xl w-full p-8 relative">
        <h1 className="text-4xl font-black uppercase text-center mb-4 tracking-tighter">Pilih Toko</h1>
        <p className="text-center text-gray-500 mb-12 font-medium">Sistem Multi-Toko. Pilih cabang yang ingin Anda kelola.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Toko 1 */}
          <button 
            onClick={() => handleSelectClick('karya_bahan')}
            disabled={loading !== null}
            className={`border-4 border-black p-8 bg-white hover:bg-black hover:text-white transition-all group flex flex-col items-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${loading === 'karya_bahan' ? 'animate-pulse' : ''}`}
          >
            <div className="w-20 h-20 bg-gray-100 group-hover:bg-gray-800 flex items-center justify-center rounded-full mb-6 transition-colors">
              <Store className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">Karya Bahan</h2>
            <p className="text-sm font-medium mt-2 text-gray-500 group-hover:text-gray-300">Toko Material & Bangunan</p>
          </button>

          {/* Toko 2 */}
          <button 
            onClick={() => handleSelectClick('bysca')}
            disabled={loading !== null}
            className={`border-4 border-black p-8 bg-white hover:bg-black hover:text-white transition-all group flex flex-col items-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${loading === 'bysca' ? 'animate-pulse' : ''}`}
          >
            <div className="w-20 h-20 bg-gray-100 group-hover:bg-gray-800 flex items-center justify-center rounded-full mb-6 transition-colors">
              <Droplet className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">BYSCA</h2>
            <p className="text-sm font-medium mt-2 text-gray-500 group-hover:text-gray-300">Toko Parfum Premium</p>
          </button>
        </div>
      </div>

      {/* PIN MODAL */}
      {activeStorePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-6 h-6" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-center mb-2 uppercase">
              {activeStorePrompt === 'bysca' ? 'BYSCA' : 'KARYA BAHAN'}
            </h2>
            <p className="text-center text-sm font-bold text-gray-500 mb-6 uppercase">Masukkan Password / PIN</p>
            
            <form onSubmit={submitPin} className="space-y-4">
              <div>
                <input
                  type={activeStorePrompt === 'bysca' ? "password" : "text"}
                  autoFocus
                  className="w-full border-2 border-black p-3 text-center text-xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={activeStorePrompt === 'bysca' ? "***" : "Ketik password..."}
                  required
                />
              </div>
              {errorMsg && (
                <p className="text-red-600 text-sm font-bold text-center animate-pulse">{errorMsg}</p>
              )}
              <button 
                type="submit" 
                disabled={loading !== null}
                className="w-full bg-black text-white p-4 font-black uppercase hover:bg-gray-800 transition-colors border-2 border-black"
              >
                {loading !== null ? 'MEMBUKA...' : 'MASUK'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
