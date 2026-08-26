import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function DynamicForm({ scheme, onSubmit }) {
  const [formData, setFormData] = useState({});

  if (!scheme) {
    return <p>No scheme selected.</p>;
  }

  const handleInputChange = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {scheme.fields?.map((field) => (
        <div
          key={field.name}
          className="space-y-2"
        >
          <Label htmlFor={field.name}>
            {field.label}
          </Label>

          {field.type === "select" ? (
            <Select
              value={formData[field.name] || ""}
              onValueChange={(value) =>
                handleInputChange(field.name, value)
              }
            >
              <SelectTrigger id={field.name}>
                <SelectValue
                  placeholder={`Select ${field.label}`}
                />
              </SelectTrigger>

              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              type={field.type || "text"}
              value={formData[field.name] || ""}
              onChange={(event) =>
                handleInputChange(
                  field.name,
                  event.target.value
                )
              }
              placeholder={`Enter ${field.label}`}
              required={field.required ?? true}
            />
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="w-full"
      >
        Check Eligibility
      </Button>
    </form>
  );
}

export default DynamicForm;