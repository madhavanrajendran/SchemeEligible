import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "@/components/custom/Navbar";
import SchemeGrid from "@/components/custom/SchemeGrid";

function Schemes() {
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch schemes from backend
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://localhost:5000/api/schemes"
        );

        setSchemes(response.data);
      } catch (error) {
        console.error("Failed to fetch schemes:", error);

        setError("Unable to load schemes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // Select a scheme
  const handleSelect = (scheme) => {
    navigate(`/eligibility/${scheme.scheme_id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <p className="text-sm font-medium text-gray-500">
              AVAILABLE SCHEMES
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Choose a scheme
            </h1>

            <p className="mt-3 text-gray-600">
              Loading available schemes...
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-xl border bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">
            Unable to load schemes
          </h1>

          <p className="mt-2 text-gray-600">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-black px-5 py-2.5 text-white"
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium text-gray-500">
            AVAILABLE SCHEMES
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Choose a scheme
          </h1>

          <p className="mt-3 text-gray-600">
            Select a scheme to check whether you meet its eligibility
            requirements.
          </p>
        </div>

        {schemes.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">
              No schemes available
            </h2>

            <p className="mt-2 text-gray-600">
              There are currently no active schemes available.
            </p>
          </div>
        ) : (
          <SchemeGrid
            schemes={schemes}
            onSelect={handleSelect}
          />
        )}
      </main>
    </div>
  );
}

export default Schemes;