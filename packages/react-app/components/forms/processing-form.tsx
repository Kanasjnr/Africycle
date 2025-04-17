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

const processingFormSchema = z.object({
  batchId: z.string({
    required_error: "Please select a batch",
  }),
  inputWeight: z.coerce
    .number({
      required_error: "Please enter the input weight",
      invalid_type_error: "Weight must be a number",
    })
    .positive("Weight must be positive"),
  outputWeight: z.coerce
    .number({
      required_error: "Please enter the output weight",
      invalid_type_error: "Weight must be a number",
    })
    .positive("Weight must be positive"),
  materialType: z.enum(["PET", "HDPE", "LDPE", "PP", "PS", "Other"], {
    required_error: "Please select a material type",
  }),
  processingType: z.enum(["Washing", "Shredding", "Pelletizing", "Other"], {
    required_error: "Please select the processing type",
  }),
  quality: z.enum(["High", "Medium", "Low"], {
    required_error: "Please select the quality",
  }),
  notes: z.string().optional(),
});

type ProcessingFormValues = z.infer<typeof processingFormSchema>;

const defaultValues: Partial<ProcessingFormValues> = {
  notes: "",
};

export function ProcessingForm() {
  const form = useForm<ProcessingFormValues>({
    resolver: zodResolver(processingFormSchema),
    defaultValues,
  });

  function onSubmit(data: ProcessingFormValues) {
    // TODO: Implement API call to save processing record
    toast.success("Processing record saved successfully");
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="batchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch ID</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BATCH-001">Batch #001 - PET Collection</SelectItem>
                  <SelectItem value="BATCH-002">Batch #002 - HDPE Collection</SelectItem>
                  <SelectItem value="BATCH-003">Batch #003 - Mixed Plastics</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the batch to process
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="inputWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Input Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>
                  Weight before processing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outputWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>
                  Weight after processing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                Select the type of material being processed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="processingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Processing Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select processing type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Washing">Washing</SelectItem>
                  <SelectItem value="Shredding">Shredding</SelectItem>
                  <SelectItem value="Pelletizing">Pelletizing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of processing performed
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
                  <SelectItem value="High">High (Grade A)</SelectItem>
                  <SelectItem value="Medium">Medium (Grade B)</SelectItem>
                  <SelectItem value="Low">Low (Grade C)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Rate the quality of the processed material
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
                Optional notes about the processing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Record Processing</Button>
      </form>
    </Form>
  );
} 