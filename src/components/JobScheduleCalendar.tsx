import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  id: string;
  resource: any;
}

export const JobScheduleCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["calendarScheduleItems"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_work_schedule_items")
        .select(`
          *,
          job_work_schedules!inner (
            id,
            user_id,
            order_number,
            supplier_name,
            status
          )
        `)
        .eq("job_work_schedules.user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const events: CalendarEvent[] = scheduleItems.map((item: any) => ({
    id: item.id,
    title: `${item.item_name} - ${item.assigned_employee_name || "Unassigned"}`,
    start: new Date(item.availability_date),
    end: item.due_date ? new Date(item.due_date) : new Date(item.availability_date),
    resource: item,
  }));

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "#3174ad";

    if (status === "completed") {
      backgroundColor = "#22c55e";
    } else if (status === "in-progress") {
      backgroundColor = "#f59e0b";
    } else if (status === "pending") {
      backgroundColor = "#6b7280";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Job Schedule Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: "600px" }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
            />
          </div>
          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Item Name</p>
                <p className="font-medium">{selectedEvent.item_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">
                  {selectedEvent.assigned_employee_name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">
                  {selectedEvent.quantity} {selectedEvent.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    selectedEvent.status === "completed"
                      ? "default"
                      : selectedEvent.status === "in-progress"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {selectedEvent.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability Date</p>
                <p className="font-medium">
                  {new Date(selectedEvent.availability_date).toLocaleDateString()}
                </p>
              </div>
              {selectedEvent.due_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {new Date(selectedEvent.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedEvent.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
