"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRole } from "@/providers/RoleProvider"
import { useAccount } from "wagmi"

const registrationSchema = z.object({
  role: z.enum(["collector", "corporate_partner", "collection_point", "recycler"], {
    required_error: "Please select a role",
  }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  location: z.string().min(2, "Location must be at least 2 characters"),
})

type RegistrationFormValues = z.infer<typeof registrationSchema>

export function RegistrationDialog() {
  const [open, setOpen] = useState(true)
  const router = useRouter()
  const { setRole } = useRole()
  const { address, isConnected } = useAccount()
  
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      role: "collector",
      name: "",
      email: "",
      location: "",
    },
  })

  // Don't show the dialog if wallet is not connected
  if (!isConnected) {
    return null
  }

  async function onSubmit(data: RegistrationFormValues) {
    try {
      if (!address) {
        toast.error("Please connect your wallet first")
        return
      }

      // Save registration data and role
      const userData = {
        ...data,
        walletAddress: address,
        registeredAt: new Date().toISOString(),
      }

      localStorage.setItem('userRole', data.role)
      localStorage.setItem('userData', JSON.stringify(userData))
      setRole(data.role)
      
      toast.success("Registration successful!")
      setOpen(false)
      router.push("/dashboard")
    } catch (error) {
      toast.error("Registration failed. Please try again.")
      console.error("Registration error:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            Please provide your details to complete the registration process.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collector">Waste Collector</SelectItem>
                      <SelectItem value="collection_point">Collection Point</SelectItem>
                      <SelectItem value="recycler">Recycler</SelectItem>
                      <SelectItem value="corporate_partner">Corporate Partner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
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
                    <Input placeholder="Enter your email" type="email" {...field} />
                  </FormControl>
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
                    <Input placeholder="Enter your location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Complete Registration
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 