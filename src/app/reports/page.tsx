"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*, materials(name)")
      .order("created_at", { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  }

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("KARYA BAHAN - Transaction Report", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 30);

    const tableColumn = ["Date", "Type", "Material", "Qty", "Total (Rp)"];
    const tableRows: any[] = [];

    transactions.forEach(t => {
      const typeStr = t.type === 'IN' ? 'BELI (IN)' : 'JUAL (OUT)';
      const priceStr = (t.type === 'IN' ? '-' : '+') + t.total_price.toLocaleString("id-ID");
      
      const rowData = [
        format(new Date(t.created_at), "dd MMM yyyy HH:mm"),
        typeStr,
        t.materials?.name || "Unknown",
        t.quantity,
        priceStr
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save("karya_bahan_report.pdf");
  };

  const exportExcel = () => {
    const worksheetData = transactions.map(t => ({
      "Date": format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss"),
      "Type": t.type === 'IN' ? 'BELI (IN)' : 'JUAL (OUT)',
      "Material": t.materials?.name || "Unknown",
      "Quantity": t.quantity,
      "Total Price (Rp)": t.type === 'IN' ? -t.total_price : t.total_price
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    XLSX.writeFile(workbook, "karya_bahan_report.xlsx");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold uppercase flex items-center gap-2">
            <FileText className="w-8 h-8" />
            REPORTS
          </h1>
          <p className="text-gray-500 mt-2">Complete transaction history and exports.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportPDF}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 border border-black px-4 py-2 font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={exportExcel}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 border border-black bg-black text-white px-4 py-2 font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 uppercase tracking-wide">
              <th className="p-4 border-b-2 border-black font-bold">Type</th>
              <th className="p-4 border-b-2 border-black font-bold">Date & Time</th>
              <th className="p-4 border-b-2 border-black font-bold">Material Name</th>
              <th className="p-4 border-b-2 border-black font-bold text-right">Quantity</th>
              <th className="p-4 border-b-2 border-black font-bold text-right">Total Price (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">Loading data...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No transactions available.</td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b border-gray-200">
                    {t.type === 'IN' ? (
                      <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-bold rounded-sm border border-red-200">BELI (IN)</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold rounded-sm border border-green-200">JUAL (OUT)</span>
                    )}
                  </td>
                  <td className="p-4 border-b border-gray-200">
                    {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="p-4 border-b border-gray-200 font-medium">
                    {t.materials?.name || "Unknown"}
                  </td>
                  <td className="p-4 border-b border-gray-200 text-right font-mono">
                    {t.quantity}
                  </td>
                  <td className={`p-4 border-b border-gray-200 text-right font-mono font-bold ${t.type === 'IN' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'IN' ? '-' : '+'} {t.total_price.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
