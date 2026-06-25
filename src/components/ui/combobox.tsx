import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ComboboxOption = string | { value: string; label: string };

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

function isObjectOption(opt: ComboboxOption): opt is { value: string; label: string } {
  return typeof opt === "object" && "value" in opt && "label" in opt;
}

function getOptionValue(opt: ComboboxOption): string {
  return isObjectOption(opt) ? opt.value : opt;
}

function getOptionLabel(opt: ComboboxOption): string {
  return isObjectOption(opt) ? opt.label : opt;
}

const Combobox = ({
  value,
  onChange,
  options,
  placeholder = "Auswählen...",
  searchPlaceholder = "Suchen...",
  emptyMessage = "Nichts gefunden.",
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedLabel = options
    .filter((o) => getOptionValue(o) === value)
    .map(getOptionLabel)[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                return (
                  <CommandItem
                    key={optionValue}
                    value={optionLabel}
                    onSelect={() => {
                      onChange(optionValue === value ? "" : optionValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === optionValue ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {optionLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
