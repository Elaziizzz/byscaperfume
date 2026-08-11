"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { FileText, Download, Calendar, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Helper function to read cookie on client side safely
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

type Transaction = {
  id: string;
  material_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  total_price: number;
  created_at: string;
  deleted_at: string | null;
  store: string;
  materials?: {
    name: string;
  };
};

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStore, setActiveStore] = useState("");
  
  // Filter state
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("ALL");

  useEffect(() => {
    const store = getCookie("store") || "karya_bahan";
    setActiveStore(store);
    fetchTransactions(store);
  }, []);

  async function fetchTransactions(store: string) {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*, materials(name)")
      .eq("store", store)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    if (data) setAllTransactions(data as Transaction[]);
    setLoading(false);
  }

  // Soft delete from report page
  async function softDeleteTransaction(id: string) {
    if (!confirm("Buang transaksi ini ke tong sampah?")) return;
    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
      
    if (error) {
      alert("Error menghapus transaksi: " + error.message);
    } else {
      fetchTransactions(activeStore);
    }
  }

  // Get unique months for the filter dropdown
  const monthYears = useMemo(() => {
    const dates = allTransactions.map(t => format(new Date(t.created_at), "MMMM yyyy"));
    return Array.from(new Set(dates)); // Unique
  }, [allTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (selectedMonthYear === "ALL") return allTransactions;
    return allTransactions.filter(t => format(new Date(t.created_at), "MMMM yyyy") === selectedMonthYear);
  }, [allTransactions, selectedMonthYear]);

  // Calculate totals
  const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + Number(t.total_price), 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + Number(t.total_price), 0);
  const netTotal = totalOut - totalIn;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const storeName = activeStore === 'bysca' ? 'BYSCA (Parfum)' : 'Karya Bahan';
    doc.text(`${storeName.toUpperCase()} - Transaction Report`, 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Periode: ${selectedMonthYear === 'ALL' ? 'Semua Waktu' : selectedMonthYear}`, 14, 30);
    doc.text(`Dicetak pada: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 35);

    const tableColumn = ["Tanggal", "Tipe", "Material", "Qty", "Total (Rp)"];
    const tableRows: any[] = [];

    filteredTransactions.forEach(t => {
      const typeStr = t.type === 'IN' ? 'BELI (IN)' : 'JUAL (OUT)';
      const priceStr = (t.type === 'IN' ? '-' : '+') + t.total_price.toLocaleString("id-ID");
      
      const rowData = [
        format(new Date(t.created_at), "dd MMM yyyy HH:mm"),
        typeStr,
        t.materials?.name || "Unknown",
        t.quantity.toString(),
        priceStr
      ];
      tableRows.push(rowData);
    });

    // Add empty row for spacing
    tableRows.push(["", "", "", "", ""]);
    
    // Add Total rows at the bottom
    tableRows.push(["", "", "", "TOTAL PENJUALAN:", `+${totalOut.toLocaleString("id-ID")}`]);
    tableRows.push(["", "", "", "TOTAL PEMBELIAN:", `-${totalIn.toLocaleString("id-ID")}`]);
    tableRows.push(["", "", "", "SALDO BERSIH:", `${netTotal >= 0 ? '+' : ''}${netTotal.toLocaleString("id-ID")}`]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      didParseCell: function (data) {
        // Make total rows bold
        if (data.row.index >= tableRows.length - 3 && data.row.index <= tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (data.column.index === 4) { // Color the amounts
             if (data.row.index === tableRows.length - 3) data.cell.styles.textColor = [0, 128, 0]; // Penjualan (Green)
             if (data.row.index === tableRows.length - 2) data.cell.styles.textColor = [200, 0, 0]; // Pembelian (Red)
          }
        }
      }
    });

    doc.save(`Laporan_${activeStore}_${selectedMonthYear.replace(' ', '_')}.pdf`);
  };

  const exportExcel = () => {
    const worksheetData = filteredTransactions.map(t => ({
      "Tanggal": format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss"),
      "Tipe": t.type === 'IN' ? 'BELI (IN)' : 'JUAL (OUT)',
      "Material": t.materials?.name || "Unknown",
      "Quantity": t.quantity,
      "Total Price (Rp)": t.type === 'IN' ? -t.total_price : t.total_price
    }));

    // Add Total rows
    worksheetData.push({ "Tanggal": "", "Tipe": "", "Material": "", "Quantity": "TOTAL JUAL", "Total Price (Rp)": totalOut as any });
    worksheetData.push({ "Tanggal": "", "Tipe": "", "Material": "", "Quantity": "TOTAL BELI", "Total Price (Rp)": -totalIn as any });
    worksheetData.push({ "Tanggal": "", "Tipe": "", "Material": "", "Quantity": "SALDO BERSIH", "Total Price (Rp)": netTotal as any });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    
    XLSX.writeFile(workbook, `Laporan_${activeStore}_${selectedMonthYear.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold uppercase flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Laporan Keuangan
          </h1>
          <p className="text-gray-500 mt-2">Riwayat transaksi bersih (tanpa sampah) dan ekspor laporan bulanan.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportPDF}
            disabled={loading || filteredTransactions.length === 0}
            className="flex items-center gap-2 border border-black px-4 py-2 font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={exportExcel}
            disabled={loading || filteredTransactions.length === 0}
            className="flex items-center gap-2 border border-black bg-black text-white px-4 py-2 font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Section M-Banking Style */}
      <div className="bg-gray-100 p-4 border border-black flex items-center gap-4">
        <Calendar className="w-6 h-6 text-gray-500" />
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pilih e-Statement (Bulan)</label>
          <select 
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="bg-white border border-black px-3 py-2 text-sm font-bold w-64 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="ALL">Semua Waktu (All Time)</option>
            {monthYears.map(my => (
              <option key={my} value={my}>{my}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-black bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-black text-white uppercase tracking-wide">
                <th className="p-4 font-bold">Tanggal</th>
                <th className="p-4 font-bold">Tipe</th>
                <th className="p-4 font-bold">Material</th>
                <th className="p-4 font-bold text-right">Qty</th>
                <th className="p-4 font-bold text-right">Total (Rp)</th>
                <th className="p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">Memuat laporan...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">Tidak ada transaksi di periode ini.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-4">
                      {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="p-4">
                      {t.type === 'IN' ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-bold rounded-sm border border-red-200">BELI (IN)</span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold rounded-sm border border-green-200">JUAL (OUT)</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">
                      {t.materials?.name || "Unknown"}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {t.quantity}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${t.type === 'IN' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'IN' ? '-' : '+'} {t.total_price.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => softDeleteTransaction(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Buang ke Tong Sampah"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* TOTALS FOOTER */}
            {!loading && filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-black">
                <tr>
                  <td colSpan={3}></td>
                  <td className="p-4 text-right font-bold uppercase text-xs text-gray-500">Total Penjualan</td>
                  <td className="p-4 text-right font-mono font-bold text-green-700">+{totalOut.toLocaleString("id-ID")}</td>
                  <td></td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td colSpan={3}></td>
                  <td className="p-4 text-right font-bold uppercase text-xs text-gray-500">Total Pembelian</td>
                  <td className="p-4 text-right font-mono font-bold text-red-700">-{totalIn.toLocaleString("id-ID")}</td>
                  <td></td>
                </tr>
                <tr className="border-t-2 border-black bg-black text-white">
                  <td colSpan={3}></td>
                  <td className="p-4 text-right font-bold uppercase text-sm">Saldo Bersih</td>
                  <td className="p-4 text-right font-mono font-bold text-lg">
                    {netTotal >= 0 ? '+' : ''}{netTotal.toLocaleString("id-ID")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
