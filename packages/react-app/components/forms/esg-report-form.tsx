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

const esgReportSchema = z.object({
  period: z.string({
    required_error: "Please select a reporting period",
  }),
  plasticFootprint: z.coerce
    .number({
      required_error: "Please enter the plastic footprint",
      invalid_type_error: "Value must be a number",
    })
    .positive("Value must be positive"),
  recycledContent: z.coerce
    .number({
      required_error: "Please enter the recycled content percentage",
      invalid_type_error: "Value must be a number",
    })
    .min(0, "Value must be between 0 and 100")
    .max(100, "Value must be between 0 and 100"),
  carbonReduction: z.coerce
    .number({
      required_error: "Please enter the carbon reduction",
      invalid_type_error: "Value must be a number",
    })
    .positive("Value must be positive"),
  waterConservation: z.coerce
    .number({
      required_error: "Please enter the water conservation",
      invalid_type_error: "Value must be a number",
    })
    .positive("Value must be positive"),
  socialImpact: z.enum(["High", "Medium", "Low"], {
    required_error: "Please select the social impact level",
  }),
  notes: z.string().optional(),
});

type ESGReportValues = z.infer<typeof esgReportSchema>;

const defaultValues: Partial<ESGReportValues> = {
  notes: "",
};

export function ESGReportForm() {
  const form = useForm<ESGReportValues>({
    resolver: zodResolver(esgReportSchema),
    defaultValues,
  });

  function onSubmit(data: ESGReportValues) {
    // TODO: Implement API call to save ESG report
    toast.success("ESG report saved successfully");
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reporting Period</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reporting period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Q1-2024">Q1 2024</SelectItem>
                  <SelectItem value="Q2-2024">Q2 2024</SelectItem>
                  <SelectItem value="Q3-2024">Q3 2024</SelectItem>
                  <SelectItem value="Q4-2024">Q4 2024</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the period for this ESG report
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plasticFootprint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plastic Footprint (kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                Total plastic footprint for the period
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recycledContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recycled Content (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                Percentage of recycled content in products
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carbonReduction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbon Reduction (tCO2e)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>
                  Carbon emissions reduced
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waterConservation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Water Conservation (m³)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>
                  Water saved through recycling
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="socialImpact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Impact</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="High">High (Significant community impact)</SelectItem>
                  <SelectItem value="Medium">Medium (Moderate community impact)</SelectItem>
                  <SelectItem value="Low">Low (Limited community impact)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Rate the social impact of your sustainability initiatives
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
                Optional notes about the ESG report
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Generate ESG Report</Button>
      </form>
    </Form>
  );
} 