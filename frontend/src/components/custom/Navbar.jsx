import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";


function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <ShieldCheck className="h-6 w-6" />
          SchemeCheck
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/schemes"
            className="text-sm font-medium text-gray-600 transition hover:text-black"
          >
            Schemes
          </Link>

          <Link
            to="/about"
            className="text-sm font-medium text-gray-600 transition hover:text-black"
          >
            About
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;