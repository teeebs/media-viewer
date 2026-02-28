interface TagChipProps {
  name: string;
  onRemove: () => void;
}

export function TagChip({ name, onRemove }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
      {name}
      <button
        onClick={onRemove}
        className="ml-1 text-blue-200 hover:text-white leading-none"
        aria-label={`Remove filter: ${name}`}
      >
        &#x2715;
      </button>
    </span>
  );
}
