import { Wrench } from "lucide-react";

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center text-[#64748B] bg-[#0F172A]">
      <Wrench className="w-12 h-12 mb-4 opacity-50" />
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-center max-w-md text-sm">
        This module is planned for a future implementation phase. Architecture interfaces are defined in the backend.
      </p>
    </div>
  );
}
