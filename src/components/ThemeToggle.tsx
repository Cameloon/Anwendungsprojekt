import { Moon, Sun, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme, ColorTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const COLORS: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "default", label: "Ozean", swatch: "bg-[hsl(222,31%,52%)]" },
  { id: "violet", label: "Violet", swatch: "bg-[hsl(262,60%,55%)]" },
  { id: "emerald", label: "Emerald", swatch: "bg-[hsl(158,64%,38%)]" },
  { id: "rose", label: "Rose", swatch: "bg-[hsl(340,75%,55%)]" },
  { id: "amber", label: "Amber", swatch: "bg-[hsl(32,85%,50%)]" },
];

export const ThemeToggle = () => {
  const { mode, toggleMode, color, setColor } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Farbthema wählen">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Farbthema</p>
          <div className="space-y-1">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm hover:bg-secondary transition-colors",
                  color === c.id && "bg-secondary"
                )}
              >
                <span className={cn("h-4 w-4 rounded-full ring-2 ring-border", c.swatch)} />
                <span className="flex-1 text-left">{c.label}</span>
                {color === c.id && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Light Mode" : "Dark Mode"}
      >
        {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default ThemeToggle;
