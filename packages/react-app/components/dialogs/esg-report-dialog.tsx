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
import { ESGReportForm } from "@/components/forms/esg-report-form";

export function ESGReportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          Generate ESG Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate ESG Report</DialogTitle>
          <DialogDescription>
            Enter your sustainability metrics for the reporting period. This data will be used to track your environmental and social impact.
          </DialogDescription>
        </DialogHeader>
        <ESGReportForm />
      </DialogContent>
    </Dialog>
  );
} 