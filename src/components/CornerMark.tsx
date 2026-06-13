export default function CornerMark() {
  return (
    <div className="flex items-center gap-2 opacity-80">
      <picture aria-hidden="true">
        <source
          media="(prefers-color-scheme: light)"
          srcSet="/logo-light.svg"
        />
        <img
          src="/logo-dark.svg"
          alt=""
          className="w-8 h-8"
        />
      </picture>
      <span className="text-text-secondary text-xl font-medium tracking-tight">
        receipts.me
      </span>
    </div>
  )
}
