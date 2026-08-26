import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/Navbar";
import ResultCard from "@/components/custom/ResultCard";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const scheme = location.state?.scheme;
  const formData = location.state?.formData;
  const result = location.state?.result;

  // ---------------------------------------------------------
  // No result available
  // ---------------------------------------------------------

  if (!scheme || !formData || !result) {
    return (
      <div className="min-h-screen">
        <Navbar />

        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">
            No result available
          </h1>

          <p className="mt-2 text-gray-600">
            Please check your eligibility first.
          </p>

          <Button
            className="mt-6"
            onClick={() => navigate("/schemes")}
          >
            Back to Schemes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-12">

        <Button
          variant="ghost"
          onClick={() => navigate("/schemes")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schemes
        </Button>

        <ResultCard result={result} />

      </main>
    </div>
  );
}

export default Result;