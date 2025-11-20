import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MoreVertical, Trash2, Eye, CheckCircle2, Circle, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export default function Checklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  
  // Create form state
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("manual");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: crypto.randomUUID(), text: "", completed: false, order: 0 }
  ]);

  // Fetch checklists
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("checklists")
        .select("*, quotations(quotation_number, customer_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch quotations for dropdown
  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("quotations")
        .select("id, quotation_number, customer_name")
        .eq("user_id", user.id)
        .order("quotation_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleAddItem = () => {
    setChecklistItems([
      ...checklistItems,
      { id: crypto.randomUUID(), text: "", completed: false, order: checklistItems.length }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const handleItemTextChange = (id: string, text: string) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  };

  const handleCreateChecklist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Filter out empty items
      const validItems = checklistItems.filter(item => item.text.trim() !== "");
      
      if (!checklistTitle.trim()) {
        toast({
          title: "Error",
          description: "Please enter a checklist title",
          variant: "destructive",
        });
        return;
      }

      if (validItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one checklist item",
          variant: "destructive",
        });
        return;
      }

      const totalItems = validItems.length;
      const completedItems = validItems.filter(item => item.completed).length;

      const { error } = await (supabase as any)
        .from("checklists")
        .insert([{
          user_id: user.id,
          title: checklistTitle,
          description: checklistDescription || null,
          quotation_id: selectedQuotationId === "manual" ? null : selectedQuotationId || null,
          items: validItems,
          total_items: totalItems,
          completed_items: completedItems,
          status: completedItems === totalItems ? "completed" : completedItems > 0 ? "in-progress" : "pending"
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Checklist created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleItem = async (checklistId: string, items: ChecklistItem[], itemId: string) => {
    try {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      const completedCount = updatedItems.filter(item => item.completed).length;
      const totalCount = updatedItems.length;

      const { error } = await (supabase as any)
        .from("checklists")
        .update({
          items: updatedItems,
          completed_items: completedCount,
          status: completedCount === totalCount ? "completed" : completedCount > 0 ? "in-progress" : "pending"
        })
        .eq("id", checklistId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      
      // Update selected checklist if viewing
      if (selectedChecklist?.id === checklistId) {
        setSelectedChecklist({ ...selectedChecklist, items: updatedItems });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this checklist?")) return;

    try {
      const { error } = await (supabase as any)
        .from("checklists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Checklist deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setChecklistTitle("");
    setChecklistDescription("");
    setSelectedQuotationId("manual");
    setChecklistItems([{ id: crypto.randomUUID(), text: "", completed: false, order: 0 }]);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "outline",
      "in-progress": "secondary",
      completed: "default"
    };
    return variants[status] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground">
            Create and manage checklists for tasks, processes, and quality control
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Checklist
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Linked To</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : checklists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No checklists found</p>
                        <p className="text-sm text-muted-foreground">
                          Create your first checklist to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  checklists.map((checklist: any) => (
                    <TableRow key={checklist.id}>
                      <TableCell className="font-medium">{checklist.title}</TableCell>
                      <TableCell>
                        {checklist.quotations ? (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{checklist.quotations.quotation_number}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {checklist.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {checklist.completed_items}/{checklist.total_items}
                          </span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{
                                width: `${(checklist.completed_items / checklist.total_items) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(checklist.status)}>
                          {checklist.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(checklist.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewChecklist(checklist)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View & Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteChecklist(checklist.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Checklist Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Checklist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Installation Quality Check"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotation">Link to Quotation (Optional)</Label>
              <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quotation or create manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual - No quotation</SelectItem>
                  {quotations.map((quotation: any) => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      {quotation.quotation_number} - {quotation.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={checklistDescription}
                onChange={(e) => setChecklistDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Checklist Items *</Label>
                <Button onClick={handleAddItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {checklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      placeholder="Enter checklist item"
                      value={item.text}
                      onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                    />
                    {checklistItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChecklist}>Create Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Checklist Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.title}</DialogTitle>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-4">
              {selectedChecklist.quotations && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Linked to Quotation</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedChecklist.quotations.quotation_number} - {selectedChecklist.quotations.customer_name}
                    </p>
                  </div>
                </div>
              )}

              {selectedChecklist.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedChecklist.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <Badge variant={getStatusBadge(selectedChecklist.status)}>
                  {selectedChecklist.status.replace("-", " ")}
                </Badge>
                <span className="text-muted-foreground">
                  {selectedChecklist.completed_items} of {selectedChecklist.total_items} completed
                </span>
              </div>

              <div className="space-y-2">
                {selectedChecklist.items?.map((item: ChecklistItem, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() =>
                        handleToggleItem(selectedChecklist.id, selectedChecklist.items, item.id)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          item.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {index + 1}. {item.text}
                      </p>
                    </div>
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
