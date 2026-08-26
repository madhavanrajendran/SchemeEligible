import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        
        <div className="mb-6 flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <ShieldCheck className="h-4 w-4" />
          Government Scheme Eligibility Checker
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
          Find the schemes you are
          <span className="block">eligible for.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Check your eligibility for various government schemes
          by providing a few basic details.
        </p>

        <Button
          asChild
          size="lg"
          className="mt-8"
        >
          <Link to="/schemes">
            Let's Check
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

      </div>
    </div>
  );
}

export default Home;