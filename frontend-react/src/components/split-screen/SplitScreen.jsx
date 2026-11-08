export default function SplitScreen({ left, right }) {
  return (
    <div className="grid min-h-[640px] gap-4 lg:grid-cols-2">
      {left}
      {right}
    </div>
  )
}
