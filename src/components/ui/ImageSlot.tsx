type Props = {
  id: string;
  label: string;
  hint?: string;
  className?: string;
};

/** Placeholder for images you will drop in later. */
export function ImageSlot({ id, label, hint, className = "" }: Props) {
  return (
    <div
      className={`image-slot ${className}`}
      data-slot-id={id}
      role="img"
      aria-label={`Image slot: ${label}`}
    >
      <div>
        <div className="mono mb-1.5 text-[0.72rem] tracking-[0.08em] text-[var(--star-dim)] uppercase">
          Image slot · {id}
        </div>
        <div className="display text-[1.05rem] text-[var(--star)]">{label}</div>
        {hint ? (
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--star-dim)]">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
