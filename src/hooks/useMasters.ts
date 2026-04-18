import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Master = { id: string; kind: string; name: string; code: string };
export type SystemComponent = {
  system_name: string;
  component_name: string;
  component_code: string;
};
export type RelatedComponent = {
  system_name: string;
  component_name: string;
  related_name: string;
  related_code: string;
};
export type ComponentSuggestion = {
  component_name: string;
  top_issues: string[];
  top_failures: string[];
};

export type MastersByKind = Record<string, Master[]>;

export interface MasterData {
  byKind: MastersByKind;
  systemComponents: SystemComponent[];
  relatedComponents: RelatedComponent[];
  suggestions: Record<string, ComponentSuggestion>;
  loading: boolean;
  error: string | null;
}

export function useMasters(): MasterData {
  const [data, setData] = useState<MasterData>({
    byKind: {},
    systemComponents: [],
    relatedComponents: [],
    suggestions: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, sc, rc, sg] = await Promise.all([
          supabase.from("masters").select("*").order("name"),
          supabase.from("system_components").select("*").order("component_name"),
          supabase.from("related_components").select("*").order("related_name"),
          supabase.from("component_suggestions").select("*"),
        ]);
        if (cancelled) return;
        if (m.error || sc.error || rc.error || sg.error) {
          throw m.error || sc.error || rc.error || sg.error;
        }
        const byKind: MastersByKind = {};
        (m.data ?? []).forEach((row: any) => {
          (byKind[row.kind] ||= []).push(row);
        });
        const sugMap: Record<string, ComponentSuggestion> = {};
        (sg.data ?? []).forEach((row: any) => {
          sugMap[row.component_name] = row;
        });
        setData({
          byKind,
          systemComponents: (sc.data as SystemComponent[]) ?? [],
          relatedComponents: (rc.data as RelatedComponent[]) ?? [],
          suggestions: sugMap,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (cancelled) return;
        setData((d) => ({ ...d, loading: false, error: e.message ?? "Failed to load" }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
