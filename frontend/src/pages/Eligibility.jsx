import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "@/components/custom/Navbar";
import DynamicForm from "@/components/custom/DynamicForm";

function Eligibility() {
  const location = useLocation();
  const navigate = useNavigate();

  const scheme = location.state?.scheme;

  if (!scheme) {
    return (
      <div className="min-h-screen">
        <Navbar />

        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">
            No scheme selected
          </h1>

          <p className="mt-2 text-gray-600">
            Please select a scheme first.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    try {
      // Send data to backend
      const response = await axios.post(
        "https://scheme-eligible.vercel.app/api/eligibility/check",
        {
          schemeId: scheme.id,
          formData: formData,
        }
      );

      // Get result from backend
      const result = response.data;

      // Go to result page
      navigate("/result", {
        state: {
          scheme,
          formData,
          result,
        },
      });
    } catch (error) {
      console.error("Eligibility check failed:", error);

      alert(
        "Something went wrong while checking eligibility."
      );
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
            Enter the required information to check your
            eligibility.
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