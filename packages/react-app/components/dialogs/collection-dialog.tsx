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
import { CollectionForm } from "@/components/forms/collection-form";

export function CollectionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          Verify New Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record New Collection</DialogTitle>
          <DialogDescription>
            Enter the details of the new collection. Make sure to verify the weight and material type.
          </DialogDescription>
        </DialogHeader>
        <CollectionForm />
      </DialogContent>
    </Dialog>
  );
} 