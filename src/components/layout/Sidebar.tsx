import Link from 'next/link';
import { cookies } from 'next/headers';
import { clearStore } from '@/app/actions/auth';

export async function Sidebar() {
  const cookieStore = await cookies();
  const activeStore = cookieStore.get('store')?.value;
  const storeName = activeStore === 'bysca' ? 'BYSCA (Parfum)' : 'Karya Bahan';

  return (
    <aside className="w-64 min-h-screen border-r border-black flex flex-col justify-between bg-white relative">
      <div className="p-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tighter mb-2 uppercase leading-none">
          Karya<br />Bahan
        </h1>
        
        {activeStore && (
          <div className="mb-8 border border-black p-3 bg-gray-50">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Toko Aktif:</div>
            <div className="font-black text-lg text-black">{storeName}</div>
            <form action={clearStore} className="mt-2">
              <button type="submit" className="text-xs underline text-blue-600 font-bold hover:text-blue-800">
                Ganti Toko &rarr;
              </button>
            </form>
          </div>
        )}

        <nav className="flex flex-col gap-4">
          <Link href="/" className="text-lg font-medium hover:underline underline-offset-4 decoration-2">
            POS Dashboard
          </Link>
          <Link href="/materials" className="text-lg font-medium hover:underline underline-offset-4 decoration-2">
            Inventory / Materials
          </Link>
          <Link href="/reports" className="text-lg font-medium hover:underline underline-offset-4 decoration-2">
            Reports
          </Link>
          <Link href="/trash" className="text-lg font-medium hover:underline underline-offset-4 decoration-2 text-red-600">
            Tong Sampah
          </Link>
          <Link href="/settings" className="text-lg font-medium hover:underline underline-offset-4 decoration-2">
            Settings
          </Link>
        </nav>
      </div>
      <div className="p-8 pt-4 border-t border-gray-200">
        <div className="text-xs font-mono uppercase tracking-widest text-gray-500">
          v1.0.0 &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}
