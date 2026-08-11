"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { PlusCircle, ShoppingCart, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

type Material = {
  id: string;
  name: string;
  current_stock: number;
  price: number;
};

type Transaction = {
  id: string;
  material_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  total_price: number;
  created_at: string;
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

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const materialSubscription = supabase
      .channel("public:materials")
      .on("postgres_changes", { event: "*", schema: "public", table: "materials" }, () => {
        fetchMaterials();
      })
      .subscribe();

    const transactionSubscription = supabase
      .channel("public:transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(materialSubscription);
      supabase.removeChannel(transactionSubscription);
    };
  }, []);

  async function fetchData() {
    await fetchMaterials();
    await fetchTransactions();
  }

  async function fetchMaterials() {
    const { data } = await supabase.from("materials").select("*").order("name");
    if (data) setMaterials(data);
  }

  async function fetchTransactions() {
    // Fetch recent for the table
    const { data: recent } = await supabase
      .from("transactions")
      .select("*, materials(name)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (recent) setTransactions(recent);

    // Fetch all for summary
    const { data: all } = await supabase
      .from("transactions")
      .select("type, total_price");
    if (all) setAllTransactions(all as Transaction[]);
  }

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const calculatedPrice = selectedMaterial ? selectedMaterial.price * Number(quantity || 0) : 0;
  
  // If IN, use custom price input, else use calculated price
  const finalPrice = transactionType === 'IN' 
    ? (customPrice !== "" ? Number(customPrice) : 0) 
    : calculatedPrice;

  const totalRevenue = allTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + Number(t.total_price), 0);
  const totalExpense = allTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + Number(t.total_price), 0);
  const netBalance = totalRevenue - totalExpense;

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterialId || quantity === "" || Number(quantity) <= 0 || finalPrice <= 0) return;

    setLoading(true);
    const { error } = await supabase.from("transactions").insert([
      {
        material_id: selectedMaterialId,
        type: transactionType,
        quantity: Number(quantity),
        total_price: finalPrice,
      },
    ]);

    setLoading(false);
    if (!error) {
      setSelectedMaterialId("");
      setQuantity("");
      setCustomPrice("");
    } else {
      console.error(error);
      alert("Error processing transaction");
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      
      {/* Financial Summary */}
      <div>
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          FINANCIAL SUMMARY
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-black p-6 bg-white">
            <div className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              Total Penjualan (Revenue)
            </div>
            <div className="text-3xl font-mono font-bold text-green-700">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="border border-black p-6 bg-white">
            <div className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Total Pembelian (Expense)
            </div>
            <div className="text-3xl font-mono font-bold text-red-700">
              Rp {totalExpense.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="border border-black p-6 bg-black text-white">
            <div className="text-sm font-bold uppercase text-gray-400 mb-2">
              Saldo / Profit (Net)
            </div>
            <div className="text-3xl font-mono font-bold">
              Rp {netBalance.toLocaleString("id-ID")}
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
                <div className="text-center p-3 border border-black font-bold uppercase peer-checked:bg-black peer-checked:text-white transition-colors">
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
                <div className="text-center p-3 border border-black font-bold uppercase peer-checked:bg-black peer-checked:text-white transition-colors">
                  Beli Bahan
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Material</label>
              <select
                className="w-full border border-black p-3 bg-transparent appearance-none focus:outline-none focus:ring-1 focus:ring-black"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                required
              >
                <option value="" disabled>Select material...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id} disabled={transactionType === 'OUT' && m.current_stock <= 0}>
                    {m.name} (Stock: {m.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Quantity</label>
              <input
                type="number"
                min="1"
                max={transactionType === 'OUT' ? (selectedMaterial?.current_stock || 1) : undefined}
                className="w-full border border-black p-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-black"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/^0+(?=\d)/, ''))}
                placeholder="Jumlah barang"
                required
              />
            </div>

            {transactionType === 'IN' && (
              <div>
                <label className="block text-sm font-bold mb-2 uppercase text-red-600">Total Harga Beli (Rp)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-black p-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-black"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value.replace(/^0+(?=\d)/, ''))}
                  placeholder="Contoh: 1500000"
                  required
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold uppercase">Total</span>
                <span className={`font-mono font-bold ${transactionType === 'IN' ? 'text-red-600' : 'text-green-600'}`}>
                  Rp {finalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedMaterialId || quantity === "" || Number(quantity) <= 0 || finalPrice <= 0}
              className="w-full bg-black text-white p-4 font-bold uppercase tracking-wider hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors flex justify-center items-center gap-2"
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
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 italic">No transactions found.</td>
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
              {materials.map((m) => (
                <div key={m.id} className="border border-black p-4 flex flex-col justify-between">
                  <div className="text-sm font-bold uppercase mb-2 truncate" title={m.name}>{m.name}</div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className={`text-2xl font-mono font-bold ${m.current_stock <= 10 ? "text-red-600" : ""}`}>
                      {m.current_stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
