import { CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ResultCard({ result }) {
  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {result.eligible ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}

          <CardTitle>
            {result.eligible
              ? "You are Eligible"
              : "You are Not Eligible"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scheme Name */}
        {result.scheme && (
          <div>
            <p className="text-sm text-gray-500">
              Scheme
            </p>

            <p className="font-medium">
              {result.scheme}
            </p>
          </div>
        )}

        {/* Result Reason */}
        {result.reason && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">
              Result
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {result.reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResultCard;