import { supabase } from "@/integrations/supabase/client";

/**
 * Helper functions to manage bidirectional relationships between security layouts and quotations
 */

export interface LayoutQuotationLink {
  layoutId: string;
  quotationId: string;
}

export interface LayoutLinkStatus {
  isLinked: boolean;
  linkedTo: { quotationId: string; quotationNumber: string; customerName: string } | null;
}

/**
 * Link a security layout to a quotation (updates both tables)
 */
export async function linkLayoutToQuotation(layoutId: string, quotationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Update security_layouts table
  const { error: layoutError } = await supabase
    .from("security_layouts")
    .update({ quotation_id: quotationId })
    .eq("id", layoutId)
    .eq("user_id", user.id);

  if (layoutError) throw layoutError;

  // Update quotations table
  const { error: quotationError } = await supabase
    .from("quotations")
    .update({ security_layout_id: layoutId })
    .eq("id", quotationId)
    .eq("user_id", user.id);

  if (quotationError) throw quotationError;
}

/**
 * Unlink a security layout from a quotation (updates both tables)
 */
export async function unlinkLayoutFromQuotation(layoutId: string, quotationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Update security_layouts table
  const { error: layoutError } = await supabase
    .from("security_layouts")
    .update({ quotation_id: null })
    .eq("id", layoutId)
    .eq("user_id", user.id);

  if (layoutError) throw layoutError;

  // Update quotations table
  const { error: quotationError } = await supabase
    .from("quotations")
    .update({ security_layout_id: null })
    .eq("id", quotationId)
    .eq("user_id", user.id);

  if (quotationError) throw quotationError;
}

/**
 * Check if a layout is already linked to another quotation
 */
export async function checkLayoutLinkStatus(layoutId: string): Promise<LayoutLinkStatus> {
  const { data: layout, error } = await supabase
    .from("security_layouts")
    .select("quotation_id")
    .eq("id", layoutId)
    .single();

  if (error) throw error;

  if (!layout.quotation_id) {
    return { isLinked: false, linkedTo: null };
  }

  // Fetch quotation details
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("id, quotation_number, customer_name")
    .eq("id", layout.quotation_id)
    .single();

  if (quotationError) throw quotationError;

  return {
    isLinked: true,
    linkedTo: {
      quotationId: quotation.id,
      quotationNumber: quotation.quotation_number,
      customerName: quotation.customer_name,
    },
  };
}

/**
 * Get quotation details for a layout
 */
export async function getQuotationForLayout(layoutId: string) {
  const { data: layout, error: layoutError } = await supabase
    .from("security_layouts")
    .select("quotation_id")
    .eq("id", layoutId)
    .single();

  if (layoutError) throw layoutError;

  if (!layout.quotation_id) return null;

  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", layout.quotation_id)
    .single();

  if (quotationError) throw quotationError;

  return quotation;
}

/**
 * Get layout details for a quotation
 */
export async function getLayoutForQuotation(quotationId: string) {
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("security_layout_id")
    .eq("id", quotationId)
    .single();

  if (quotationError) throw quotationError;

  if (!quotation.security_layout_id) return null;

  const { data: layout, error: layoutError } = await supabase
    .from("security_layouts")
    .select("*")
    .eq("id", quotation.security_layout_id)
    .single();

  if (layoutError) throw layoutError;

  return layout;
}
