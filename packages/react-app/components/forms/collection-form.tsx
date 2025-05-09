'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const collectionFormSchema = z.object({
  collectorId: z.string({
    required_error: "Please select a collector",
  }),
  weight: z.coerce
    .number({
      required_error: "Please enter the weight",
      invalid_type_error: "Weight must be a number",
    })
    .positive("Weight must be positive"),
  materialType: z.enum(["PET", "HDPE", "LDPE", "PP", "PS", "Other"], {
    required_error: "Please select a material type",
  }),
  quality: z.enum(["High", "Medium", "Low"], {
    required_error: "Please select the quality",
  }),
  notes: z.string().optional(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

const defaultValues: Partial<CollectionFormValues> = {
  notes: "",
};

export function CollectionForm() {
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues,
  });

  function onSubmit(data: CollectionFormValues) {
    // TODO: Implement API call to save collection
    toast.success("Collection recorded successfully");
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="collectorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collector</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collector" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">John Doe</SelectItem>
                  <SelectItem value="2">Jane Smith</SelectItem>
                  <SelectItem value="3">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the collector who brought the materials
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                Enter the total weight in kilograms
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="materialType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PET">PET (Type 1)</SelectItem>
                  <SelectItem value="HDPE">HDPE (Type 2)</SelectItem>
                  <SelectItem value="LDPE">LDPE (Type 4)</SelectItem>
                  <SelectItem value="PP">PP (Type 5)</SelectItem>
                  <SelectItem value="PS">PS (Type 6)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the primary type of material collected
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="High">High (Clean & Sorted)</SelectItem>
                  <SelectItem value="Medium">Medium (Mixed)</SelectItem>
                  <SelectItem value="Low">Low (Contaminated)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Rate the quality of the collected materials
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Any additional notes..." {...field} />
              </FormControl>
              <FormDescription>
                Optional notes about the collection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Record Collection</Button>
      </form>
    </Form>
  );
} 