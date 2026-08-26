import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SchemeCard({ scheme, onSelect }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{scheme.name}</CardTitle>

        <CardDescription>
          {scheme.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {scheme.benefit && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Benefit:</span>{" "}
            {scheme.benefit}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onSelect(scheme)}
        >
          Check Eligibility
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SchemeCard;