import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-[#c8102e] font-black text-2xl leading-none tracking-tight">BEM</span>
          <span className="text-[10px] font-semibold text-[#c8102e] leading-tight mt-1">Dakar</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-800 hover:text-[#c8102e] transition-colors">
            Accueil
          </Link>
          <Link href="/catalogue" className="text-sm font-medium text-gray-800 hover:text-[#c8102e] transition-colors">
            Catalogue
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-800 hover:text-[#c8102e] transition-colors">
            Contact
          </Link>
          <Link href="/a-propos" className="text-sm font-medium text-gray-800 hover:text-[#c8102e] transition-colors">
            À propos de nous
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button className="text-gray-700 hover:text-[#c8102e] transition-colors" aria-label="Rechercher">
            <Search size={20} />
          </button>
          <Link href="/compte" className="text-gray-700 hover:text-[#c8102e] transition-colors" aria-label="Compte">
            <User size={20} />
          </Link>
          <Link href="/panier" className="text-gray-700 hover:text-[#c8102e] transition-colors relative" aria-label="Panier">
            <ShoppingBag size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
