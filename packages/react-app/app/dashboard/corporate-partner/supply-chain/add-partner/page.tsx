'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/providers/RoleProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

const partnerSchema = z.object({
  type: z.enum(["collection_point", "recycler"], {
    required_error: "Please select a partner type",
  }),
  name: z.string({
    required_error: "Please enter the partner name",
  }),
  location: z.string({
    required_error: "Please enter the location",
  }),
  contactPerson: z.string({
    required_error: "Please enter the contact person's name",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  phone: z.string({
    required_error: "Please enter the phone number",
  }),
  materials: z.array(z.string()).min(1, {
    message: "Please select at least one material",
  }),
  capacity: z.string().optional(),
  certification: z.string().optional(),
});

type PartnerValues = z.infer<typeof partnerSchema>;

const defaultValues: Partial<PartnerValues> = {
  materials: [],
};

const materials = [
  { value: "PET", label: "PET" },
  { value: "HDPE", label: "HDPE" },
  { value: "PP", label: "PP" },
  { value: "MLP", label: "MLP" },
];

export default function AddPartnerPage() {
  const { isRegistered, role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isRegistered || role !== "corporate_partner") {
      router.push("/");
    }
  }, [isRegistered, role, router]);

  const form = useForm<PartnerValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues,
  });

  function onSubmit(data: PartnerValues) {
    // TODO: Implement API call to save partner
    toast.success("Partner added successfully");
    router.push("/dashboard/corporate-partner/supply-chain");
  }

  if (!isRegistered || role !== "corporate_partner") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Partner</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select partner type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="collection_point">Collection Point</SelectItem>
                        <SelectItem value="recycler">Recycler</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this is a collection point or recycler
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter partner name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of the partner organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormDescription>
                      The physical location of the partner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person's name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The primary contact person
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormDescription>
                        Contact person's email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Contact person's phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const current = field.value || [];
                        if (!current.includes(value)) {
                          field.onChange([...current, value]);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select materials" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.value} value={material.value}>
                            {material.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the materials this partner handles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("type") === "recycler" && (
                <>
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Capacity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5000 kg/day" {...field} />
                        </FormControl>
                        <FormDescription>
                          Daily processing capacity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ISO 14001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Environmental certification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" className="w-full">Add Partner</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 