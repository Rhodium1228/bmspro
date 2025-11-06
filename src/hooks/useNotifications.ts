import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications" as any)
      .update({ is_read: true } as any)
      .eq("id", notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications" as any)
      .update({ is_read: true } as any)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications" as any)
      .delete()
      .eq("id", notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
