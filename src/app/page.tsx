"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { PlusCircle, ShoppingCart, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

type Material = {
  id: string;
  name: string;
  current_stock: number;
  cost_price: number;
  price: number;
  code?: string;
};

type Transaction = {
  id: string;
  material_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  cost_price: number;
  total_price: number;
  created_at: string;
  deleted_at: string | null;
  materials?: {
    name: string;
  };
};

export default function POSDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // For summary
  
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('OUT');
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialBudget, setInitialBudget] = useState<number>(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");
  const [activeStore] = useState<string>("bysca");
  const [transactionDate, setTransactionDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData("bysca");

    // Set default datetime to local current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setTransactionDate(now.toISOString().slice(0, 16));

    // Subscribe to real-time changes
    const materialSubscription = supabase
      .channel("public:materials")
      .on("postgres_changes", { event: "*", schema: "public", table: "materials" }, () => {
        fetchMaterials("bysca");
      })
      .subscribe();

    const transactionSubscription = supabase
      .channel("public:transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchTransactions("bysca");
      })
      .subscribe();

    // Load initial budget from localStorage (per store)
    const savedBudget = localStorage.getItem(`karyabahan_initial_budget_bysca`);
    if (savedBudget) {
      setInitialBudget(Number(savedBudget));
    } else {
      setInitialBudget(0);
    }

    return () => {
      supabase.removeChannel(materialSubscription);
      supabase.removeChannel(transactionSubscription);
    };
  }, []);

  function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(tempBudget);
    setInitialBudget(val);
    localStorage.setItem(`karyabahan_initial_budget_${activeStore}`, val.toString());
    setIsEditingBudget(false);
  }

  async function fetchData(store: string) {
    await fetchMaterials(store);
    await fetchTransactions(store);
  }

  async function fetchMaterials(store: string) {
    const { data } = await supabase.from("materials").select("*").eq("store", store).order("name");
    if (data) setMaterials(data);
  }

  async function fetchTransactions(store: string) {
    // Fetch recent for the table (only active ones)
    const { data: recent } = await supabase
      .from("transactions")
      .select("*, materials(name)")
      .eq("store", store)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    if (recent) setTransactions(recent);

    // Fetch all for summary (only active ones)
    const { data: all } = await supabase
      .from("transactions")
      .select("type, total_price")
      .eq("store", store)
      .is("deleted_at", null);
    if (all) setAllTransactions(all as Transaction[]);
  }

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.code && m.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const calculatedPrice = selectedMaterial ? selectedMaterial.price * Number(quantity || 0) : 0;
  
  // If IN, customPrice is Modal per Pcs, so Total = Modal per Pcs * Quantity
  const finalPrice = transactionType === 'IN' 
    ? (customPrice !== "" ? Number(customPrice) * Number(quantity || 0) : 0) 
    : calculatedPrice;

  const totalRevenue = allTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + Number(t.total_price), 0);
  const totalExpense = allTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + Number(t.total_price), 0);
  const netBalance = totalRevenue - totalExpense;
  const currentBudget = initialBudget + netBalance;

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterialId || quantity === "" || Number(quantity) <= 0 || finalPrice <= 0) return;

    setLoading(true);
    
    // For OUT, cost_price is what's in the DB. For IN, calculate inferred cost_price or fallback to DB cost.
    let transactionCostPrice = selectedMaterial?.cost_price || 0;
    if (transactionType === 'IN' && quantity && finalPrice) {
       transactionCostPrice = finalPrice / Number(quantity);
       // Optional: We could update the materials table to average the cost price here, but let's keep it simple for now
    }

    const insertData: any = {
      material_id: selectedMaterialId,
      type: transactionType,
      quantity: Number(quantity),
      cost_price: transactionCostPrice,
      total_price: finalPrice,
      store: activeStore
    };

    if (transactionDate) {
      insertData.created_at = new Date(transactionDate).toISOString();
    }

    const { error } = await supabase.from("transactions").insert([insertData]);

    setLoading(false);
    if (!error) {
      showToast("Transaksi berhasil disimpan", "success");
      setSelectedMaterialId("");
      setSearchQuery("");
      setQuantity("");
      setCustomPrice("");
    } else {
      console.error(error);
      showToast("Gagal menyimpan transaksi", "error");
    }
  }

  async function softDeleteTransaction(id: string) {
    if (!confirm("Buang transaksi ini ke tong sampah?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
      
    setLoading(false);
    if (error) {
      console.error(error);
      showToast("Gagal menghapus transaksi", "error");
    } else {
      showToast("Transaksi berhasil dihapus", "success");
    }
  }

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const itemElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const selectMaterial = (m: Material) => {
    if (transactionType === 'OUT' && m.current_stock <= 0) return;
    setSelectedMaterialId(m.id);
    setSearchQuery(m.code ? `[${m.code}] ${m.name}` : m.name);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown') setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredMaterials.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredMaterials.length) {
        selectMaterial(filteredMaterials[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
      
      {/* Financial Summary */}
      <div>
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          FINANCIAL SUMMARY
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-black p-6 bg-white hover-elevate transition-swiss group">
            <div className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2 group-hover:text-black transition-colors">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              Total Penjualan (Revenue)
            </div>
            <div className="text-3xl font-mono font-bold text-green-700">
              Rp <AnimatedNumber value={totalRevenue} />
            </div>
          </div>
          <div className="border border-black p-6 bg-white hover-elevate transition-swiss group">
            <div className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2 group-hover:text-black transition-colors">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Total Pembelian (Expense)
            </div>
            <div className="text-3xl font-mono font-bold text-red-700">
              Rp <AnimatedNumber value={totalExpense} />
            </div>
          </div>
          <div className="border border-black p-6 bg-black text-white relative hover-elevate transition-swiss">
            <div className="text-sm font-bold uppercase text-gray-400 mb-2 flex justify-between items-center">
              <span>Sisa Saldo Kas (Budget)</span>
              <button onClick={() => { setIsEditingBudget(true); setTempBudget(initialBudget.toString()); }} className="text-xs border border-gray-600 px-2 py-1 hover:bg-gray-800 transition-colors active-press">
                Set Modal Awal
              </button>
            </div>
            
            {isEditingBudget ? (
              <form onSubmit={saveBudget} className="flex gap-2 mt-2 animate-fade-in">
                <input 
                  type="number" 
                  className="flex-1 bg-transparent border-b border-white text-white focus:outline-none focus:border-gray-400 transition-colors" 
                  value={tempBudget}
                  onChange={e => setTempBudget(e.target.value)}
                  placeholder="Modal Awal"
                  autoFocus
                />
                <button type="submit" className="text-xs bg-white text-black px-2 font-bold uppercase hover:bg-gray-200 transition-colors active-press">Save</button>
                <button type="button" onClick={() => setIsEditingBudget(false)} className="text-xs text-gray-400 px-2 hover:text-white transition-colors">X</button>
              </form>
            ) : (
              <div className="text-3xl font-mono font-bold">
                Rp <AnimatedNumber value={currentBudget} />
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              (Modal: Rp {initialBudget.toLocaleString("id-ID")} + Profit: Rp {netBalance.toLocaleString("id-ID")})
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* POS Form */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            NEW TRANSACTION
          </h2>
          
          <form onSubmit={handleTransaction} className="space-y-6">
            
            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wide">Tanggal Transaksi</label>
              <input
                type="datetime-local"
                className="w-full border border-black p-3 bg-transparent focus-ring transition-swiss"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>

            {/* Transaction Type Toggle */}
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="OUT" 
                  className="peer sr-only"
                  checked={transactionType === 'OUT'}
                  onChange={() => setTransactionType('OUT')}
                />
                <div className="text-center p-3 border border-black font-bold uppercase peer-checked:bg-black peer-checked:text-white hover:bg-gray-100 peer-checked:hover:bg-black transition-swiss active-press">
                  Jual Barang
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="IN" 
                  className="peer sr-only"
                  checked={transactionType === 'IN'}
                  onChange={() => setTransactionType('IN')}
                />
                <div className="text-center p-3 border border-black font-bold uppercase peer-checked:bg-black peer-checked:text-white hover:bg-gray-100 peer-checked:hover:bg-black transition-swiss active-press">
                  Beli Bahan
                </div>
              </label>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold mb-2 uppercase">Material / Kode Barang</label>
              <div 
                className={`w-full border bg-white flex items-center relative transition-swiss ${isDropdownOpen ? 'border-black ring-1 ring-black' : 'border-black'}`}
              >
                <input
                  type="text"
                  className="w-full p-3 bg-transparent focus:outline-none"
                  placeholder="Ketik nama atau kode barang..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(-1);
                    setIsDropdownOpen(true);
                    if (selectedMaterialId) setSelectedMaterialId(""); // Clear selection if typing
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
              </div>

              {isDropdownOpen && (
                <div ref={dropdownRef} className="absolute z-20 w-full mt-1 bg-white border border-black shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                  {filteredMaterials.length === 0 ? (
                    <div className="p-3 text-gray-500 text-sm">Tidak ditemukan...</div>
                  ) : (
                    filteredMaterials.map((m, index) => (
                      <div
                        key={m.id}
                        className={`p-3 cursor-pointer border-b border-gray-100 transition-colors flex justify-between items-center ${transactionType === 'OUT' && m.current_stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} ${selectedMaterialId === m.id ? 'bg-gray-200 font-bold' : ''} ${highlightedIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent onBlur from firing before click
                          selectMaterial(m);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div>
                          {m.code && <span className="text-xs font-mono bg-white px-1 py-0.5 rounded mr-2 border border-black">{m.code}</span>}
                          <span>{m.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">Stock: {m.current_stock}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Quantity</label>
              <input
                type="number"
                min="1"
                max={transactionType === 'OUT' ? (selectedMaterial?.current_stock || 1) : undefined}
                className="w-full border border-black p-3 bg-transparent focus-ring transition-swiss"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/^0+(?=\d)/, ''))}
                placeholder="Jumlah barang"
                required
              />
            </div>

            {transactionType === 'IN' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold mb-2 uppercase text-red-600">Harga Modal / Pcs (Rp)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-black p-3 bg-transparent focus-ring transition-swiss"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value.replace(/^0+(?=\d)/, ''))}
                  placeholder="Contoh: 50000"
                  required
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold uppercase">Total</span>
                <span className={`font-mono font-bold ${transactionType === 'IN' ? 'text-red-600' : 'text-green-600'}`}>
                  Rp <AnimatedNumber value={finalPrice} />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedMaterialId || quantity === "" || Number(quantity) <= 0 || finalPrice <= 0}
              className="w-full bg-black text-white p-4 font-bold uppercase tracking-wider hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-swiss hover-elevate active-press flex justify-center items-center gap-2"
            >
              {loading ? "PROCESSING..." : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  SUBMIT
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Transactions & Stock */}
        <div className="lg:col-span-2 space-y-12">
          <div>
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">
              RECENT TRANSACTIONS
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-100 uppercase tracking-wide">
                    <th className="p-3 border-b-2 border-black font-bold">Type</th>
                    <th className="p-3 border-b-2 border-black font-bold">Date</th>
                    <th className="p-3 border-b-2 border-black font-bold">Material</th>
                    <th className="p-3 border-b-2 border-black font-bold text-right">Qty</th>
                    <th className="p-3 border-b-2 border-black font-bold text-right">Total (Rp)</th>
                    <th className="p-3 border-b-2 border-black font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 italic">No active transactions found.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="p-3 border-b border-gray-200">
                          {t.type === 'IN' ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-bold rounded-sm border border-red-200">BELI (IN)</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold rounded-sm border border-green-200">JUAL (OUT)</span>
                          )}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                        </td>
                        <td className="p-3 border-b border-gray-200 font-medium">
                          {t.materials?.name || "Unknown"}
                        </td>
                        <td className="p-3 border-b border-gray-200 text-right font-mono">
                          {t.quantity}
                        </td>
                        <td className={`p-3 border-b border-gray-200 text-right font-mono font-bold ${t.type === 'IN' ? 'text-red-600' : 'text-green-600'}`}>
                          {t.type === 'IN' ? '-' : '+'} {t.total_price.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 border-b border-gray-200 text-center">
                          <button 
                            onClick={() => softDeleteTransaction(t.id)}
                            className="text-xs border border-red-500 text-red-600 px-2 py-1 hover:bg-red-600 hover:text-white transition-swiss active-press"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">
              CURRENT INVENTORY
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {materials.length === 0 ? (
                // Skeleton loading
                [1,2,3].map(i => (
                  <div key={i} className="border border-gray-200 p-4 animate-pulse bg-gray-50">
                    <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
                    <div className="flex justify-between items-end">
                      <div className="h-3 bg-gray-200 w-8"></div>
                      <div className="h-6 bg-gray-200 w-12"></div>
                    </div>
                  </div>
                ))
              ) : (
                materials.map((m) => (
                  <div key={m.id} className="border border-black p-4 flex flex-col justify-between bg-white hover-elevate transition-swiss group relative">
                    {m.current_stock <= 10 && (
                      <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 animate-fade-in uppercase">⚠️ Low</span>
                    )}
                    <div className="text-sm font-bold uppercase mb-2 truncate group-hover:text-blue-600 transition-colors" title={m.name}>{m.name}</div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-500">Stock</div>
                      <div className={`text-2xl font-mono font-bold ${m.current_stock <= 10 ? "text-red-600" : ""}`}>
                        {m.current_stock}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
