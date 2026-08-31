"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'POS Dashboard' },
    { href: '/materials', label: 'Inventory / Materials' },
    { href: '/reports', label: 'Reports' },
    { href: '/trash', label: 'Tong Sampah', customClass: 'text-red-600' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-black hover-elevate"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 min-h-screen border-r border-black flex flex-col justify-between bg-white 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4 pt-16 md:pt-8">
          <div className="mb-8 border-b-4 border-black pb-4 hover-elevate cursor-pointer">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight mb-2 text-black break-words">
            BYSCA
          </h1>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Toko Parfum Premium
          </div>
        </div>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className={`
                    relative text-lg font-medium py-2 px-3 transition-swiss hover:translate-x-1 hover:bg-gray-50
                    ${link.customClass || ''}
                    ${isActive ? 'font-bold bg-gray-100' : ''}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-black animate-fade-in"></span>
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-8 pt-4 border-t border-gray-200">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-black transition-swiss cursor-pointer">
          v1.0.0 &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
    </>
  );
}
