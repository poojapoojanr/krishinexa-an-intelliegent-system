"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "@/hooks/use-location";

export default function LocationSelector() {
  const { districts, selectedDistrict, setDistrict } = useLocation();

  return (
    <div className="space-y-2">
      <Label>District</Label>
      <Select
        value={selectedDistrict?.district || ""}
        onValueChange={setDistrict}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select District..." />
        </SelectTrigger>
        <SelectContent>
          {districts.map((d) => (
            <SelectItem key={d.district} value={d.district}>
              {d.district}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
