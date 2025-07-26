import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo_blynx.svg"; // or logo.svg


const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-brand">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Blynx
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link 
            to="/analyze" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/analyze" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Analyze
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/analyze">
            <Button variant="gradient" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;