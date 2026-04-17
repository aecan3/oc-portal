"use client";

import { FileText } from "lucide-react";
import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function SetupOCPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [address, setAddress] = useState("");
  const [planNumber, setPlanNumber] = useState("");
  const [totalLots, setTotalLots] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onPickPdf = (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      const message = "Please select a PDF file for the Plan of Subdivision.";
      setErrorMessage(message);
      alert(message);
      return;
    }
    setErrorMessage("");
    setSelectedPdf(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPickPdf(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    onPickPdf(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!supabase) {
      const message = "Supabase environment variables are missing.";
      setErrorMessage(message);
      alert(message);
      return;
    }

    if (!address.trim() || !planNumber.trim() || totalLots < 1) {
      const message = "Please complete all fields and set Total Lots to at least 1.";
      setErrorMessage(message);
      alert(message);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      const message = "You must be logged in to create a property";
      setErrorMessage(message);
      alert(message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Step A: Create the property and return its id.
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          address: address.trim(),
          plan_number: planNumber.trim(),
          total_lots: totalLots,
          manager_id: user.id,
        })
        .select("id")
        .single();

      if (propertyError || !property) {
        throw propertyError ?? new Error("Property insert failed.");
      }

      // Step B: Build lots payload from 1..N using placeholder liability share.
      const lotsPayload = Array.from({ length: totalLots }, (_unused, index) => ({
        property_id: property.id,
        lot_number: `Unit ${index + 1}`,
        liability_share: 10,
      }));

      // Step C: Bulk insert generated lots.
      const { error: lotsError } = await supabase.from("lots").insert(lotsPayload);
      if (lotsError) {
        throw lotsError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to create Owners Corporation setup.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl space-y-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">Plan of Subdivision (PDF)</CardTitle>
            <CardDescription>Drop your PDF now to attach later in the onboarding process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="plan-of-subdivision-file"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-white"
              }`}
            >
              <FileText className="mb-2 h-6 w-6 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Drag and drop PDF here, or click to upload</p>
              <p className="mt-1 text-xs text-slate-500">Only .pdf files are supported for this step.</p>
              <input
                id="plan-of-subdivision-file"
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>

            {selectedPdf ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">{selectedPdf.name}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">OC Setup</CardTitle>
          <CardDescription>Create your Owners Corporation and generate initial lots.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="property-address">Street Address (Exclude Unit Numbers)</Label>
              <div data-address-autocomplete-slot>
                <Input
                  id="property-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="123 Collins Street, Melbourne VIC"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-number">Plan Number</Label>
              <Input
                id="plan-number"
                value={planNumber}
                onChange={(event) => setPlanNumber(event.target.value)}
                placeholder="PS123456V"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-lots">Total Lots</Label>
              <Input
                id="total-lots"
                type="number"
                min={1}
                value={totalLots}
                onChange={(event) => setTotalLots(Number(event.target.value) || 0)}
                required
              />
            </div>

            {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Owners Corporation..." : "Create Owners Corporation"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
