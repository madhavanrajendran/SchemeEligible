import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "@/components/custom/Navbar";
import DynamicForm from "@/components/custom/DynamicForm";

function Eligibility() {
  const { schemeId } = useParams();
  const navigate = useNavigate();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch selected scheme from backend
  useEffect(() => {
    const fetchScheme = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `http://localhost:5000/api/schemes/${schemeId}`
        );

        setScheme(response.data);
      } catch (error) {
        console.error("Failed to fetch scheme:", error);

        setError("Unable to load the selected scheme.");
      } finally {
        setLoading(false);
      }
    };

    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">
            Loading scheme...
          </h1>

          <p className="mt-2 text-gray-600">
            Please wait while we load the scheme details.
          </p>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">
            Scheme not found
          </h1>

          <p className="mt-2 text-gray-600">
            {error || "The requested scheme could not be found."}
          </p>

          <button
            onClick={() => navigate("/schemes")}
            className="mt-6 rounded-lg bg-black px-5 py-2.5 text-white"
          >
            Back to schemes
          </button>
        </main>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/eligibility/check",
        {
          schemeId: scheme.scheme_id,
          formData,
        }
      );

      const result = response.data;

      navigate("/result", {
        state: {
          scheme,
          formData,
          result,
        },
      });
    } catch (error) {
      console.error("Eligibility check failed:", error);

      alert("Something went wrong while checking eligibility.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            ELIGIBILITY CHECK
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {scheme.name}
          </h1>

          <p className="mt-2 text-gray-600">
            Enter the required information to check your eligibility.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <DynamicForm
            scheme={scheme}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}

export default Eligibility;