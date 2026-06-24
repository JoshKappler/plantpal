"use client";

import Link from "next/link";
import { AddPlantForm } from "@/components/AddPlantForm";
import { ChevronLeft } from "@/components/icons";

export default function AddPage() {
  return (
    <>
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-card ring-1 ring-moss/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl">Add a plant</h1>
      </header>
      <AddPlantForm />
    </>
  );
}
