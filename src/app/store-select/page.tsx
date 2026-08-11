"use client";

import { selectStore } from "@/app/actions/auth";
import { Store, Droplet } from "lucide-react";
import { useState } from "react";

export default function StoreSelectPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (storeId: string) => {
    setLoading(storeId);
    await selectStore(storeId);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 absolute inset-0 z-50">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-4xl font-black uppercase text-center mb-4 tracking-tighter">Pilih Toko</h1>
        <p className="text-center text-gray-500 mb-12 font-medium">Sistem Multi-Toko. Pilih cabang yang ingin Anda kelola.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Toko 1 */}
          <button 
            onClick={() => handleSelect('karya_bahan')}
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
            onClick={() => handleSelect('bysca')}
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
    </div>
  );
}
