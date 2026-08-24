import { IconBottle } from "@/components/icons"

export function EmptyState() {
  return (
    <div className="text-center py-10 text-tx3">
      <IconBottle size={36} className="opacity-30 mb-3" />
      <p className="text-[15px] font-display font-semibold">Nothing here</p>
      <p className="mt-1.5 text-[13px]">Try clearing your filters.</p>
    </div>
  )
}
