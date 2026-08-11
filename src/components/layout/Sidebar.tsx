import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r border-black p-8 flex flex-col justify-between bg-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter mb-12 uppercase leading-none">
          Karya<br />Bahan
        </h1>
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
        </nav>
      </div>
      <div>
        <form action={async () => {
          "use server";
          const { logout } = await import("@/app/actions/auth");
          await logout();
        }}>
          <button type="submit" className="text-sm font-bold text-red-600 hover:underline uppercase mb-4 text-left w-full">
            Log Out
          </button>
        </form>
        <div className="text-xs font-mono uppercase tracking-widest text-gray-500">
          v1.0.0 &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}
