import { SectionTitle } from "@/components/primitives"

export function StepsSection({ steps }) {
  return (
    <div>
      <SectionTitle>Preparation</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="w-5.5 h-5.5 rounded-full bg-surface3 border border-bdr shrink-0 flex items-center justify-center text-[11px] font-mono text-cyan font-semibold">
              {i + 1}
            </span>
            <p className="text-sm text-tx leading-[1.55]">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
