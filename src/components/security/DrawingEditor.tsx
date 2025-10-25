import { useState } from "react";
import { Drawing } from "@/lib/securityTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DrawingEditorProps {
  drawing: Drawing;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Drawing>) => void;
  onDelete: () => void;
}

export const DrawingEditor = ({
  drawing,
  open,
  onClose,
  onUpdate,
  onDelete,
}: DrawingEditorProps) => {
  const [color, setColor] = useState(drawing.color);
  const [strokeWidth, setStrokeWidth] = useState(drawing.strokeWidth);

  const handleSave = () => {
    onUpdate({ color, strokeWidth });
    onClose();
  };

  const handleDelete = () => {
    const confirm = window.confirm("Delete this drawing?");
    if (confirm) {
      onDelete();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Drawing</DialogTitle>
          <DialogDescription>
            Modify the appearance of your drawing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="drawing-color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="drawing-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stroke-width">
              Stroke Width: {strokeWidth}px
            </Label>
            <Slider
              id="stroke-width"
              min={1}
              max={20}
              step={1}
              value={[strokeWidth]}
              onValueChange={(value) => setStrokeWidth(value[0])}
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Drawing
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
