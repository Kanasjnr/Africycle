'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessingForm } from "@/components/forms/processing-form";

export function ProcessingDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          Record Processing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Material Processing</DialogTitle>
          <DialogDescription>
            Enter the details of the material processing. Make sure to verify input and output weights.
          </DialogDescription>
        </DialogHeader>
        <ProcessingForm />
      </DialogContent>
    </Dialog>
  );
} 