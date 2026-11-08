import { Check } from "lucide-react"

const steps = ["Soạn thảo", "Lớp duyệt", "Khoa duyệt", "Hoàn tất"]

export default function ProgressStepper({ current = 0 }) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => (
        <div
          key={step}
          className="relative flex flex-1 flex-col items-center text-center"
        >
          {index > 0 && (
            <span
              className={`absolute right-1/2 top-3 h-px w-full ${
                index <= current ? "bg-night" : "bg-line"
              }`}
            />
          )}
          <span
            className={`relative z-10 flex size-6 items-center justify-center rounded-full border-2 text-[10px] ${
              index < current
                ? "border-night bg-night text-white"
                : index === current
                  ? "border-brand bg-white text-brand"
                  : "border-line bg-white text-disabled"
            }`}
          >
            {index < current ? <Check className="size-3" /> : index + 1}
          </span>
          <span
            className={`mt-2 text-xs ${
              index === current ? "font-semibold text-brand" : "text-muted"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  )
}
