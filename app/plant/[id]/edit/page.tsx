"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/app/providers";
import { EditPlantForm } from "@/components/EditPlantForm";
import { ChevronLeft } from "@/components/icons";

export default function EditPlantPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, plants } = useApp();
  const plant = plants.find((p) => p.id === id);

  if (!ready) return <p className="mt-16 text-center text-moss/50">Loading…</p>;
  if (!plant)
    return (
      <div className="mt-16 text-center">
        <p className="text-moss/55">That plant isn&apos;t here anymore.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-leaf">
          Back to your jungle
        </Link>
      </div>
    );

  return (
    <>
      <header className="mb-4 flex items-center gap-3">
        <Link
          href={`/plant/${plant.id}`}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-card ring-1 ring-moss/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl italic">Edit {plant.name}</h1>
      </header>
      <EditPlantForm plant={plant} />
    </>
  );
}
