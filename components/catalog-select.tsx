import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CatalogSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string; group?: string }>;
  label: string;
  className?: string;
}) {
  const groups = options.reduce<Array<{ name: string | undefined; items: typeof options[number][] }>>((acc, option) => {
    const group = acc.find((entry) => entry.name === option.group);
    if (group) group.items.push(option);
    else acc.push({ name: option.group, items: [option] });
    return acc;
  }, []);
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger aria-label={label} className={cn("min-h-11 w-full min-w-0 text-sm sm:w-auto", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="max-h-[min(26rem,70dvh)]">
        {groups.map((group) => <SelectGroup key={group.name ?? "default"}>
          {group.name && <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</div>}
          {group.items.map((option) => (
            <SelectItem key={option.value} value={option.value} className="min-h-10 px-3 py-2 pr-9">{option.label}</SelectItem>
          ))}
        </SelectGroup>)}
      </SelectContent>
    </Select>
  );
}
