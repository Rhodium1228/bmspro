import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export const KeyboardShortcuts = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: `${modKey} + Z`, action: "Undo" },
    { keys: `${modKey} + Shift + Z`, action: "Redo" },
    { keys: `${modKey} + C`, action: "Copy" },
    { keys: `${modKey} + V`, action: "Paste" },
    { keys: `${modKey} + D`, action: "Duplicate" },
    { keys: "Delete / Backspace", action: "Delete selected" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Keyboard Shortcuts</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Speed up your workflow with these shortcuts
            </p>
          </div>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
