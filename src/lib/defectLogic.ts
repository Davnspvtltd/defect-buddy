import type { MasterData } from "@/hooks/useMasters";

export interface FormState {
  date: string;
  source: string;
  vin: string;
  model: string;
  shop: string;
  location: string;
  zone: string;
  sub_zone: string;
  system: string;
  sub_system: string;
  component: string;
  related_component: string;
  issue_type: string;
  failure_mode: string;
  condition: string;
  symptom: string;
  description_auto: string;
  description_override: boolean;
}

export const emptyForm = (): FormState => ({
  date: new Date().toISOString().slice(0, 10),
  source: "",
  vin: "",
  model: "",
  shop: "",
  location: "",
  zone: "",
  sub_zone: "",
  system: "",
  sub_system: "",
  component: "",
  related_component: "",
  issue_type: "",
  failure_mode: "",
  condition: "",
  symptom: "",
  description_auto: "",
  description_override: false,
});

const dash = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" – ");

export function buildDescription(f: FormState): string {
  return dash(f.component, f.issue_type, f.failure_mode, f.location);
}

function codeOf(masters: MasterData, kind: string, name: string): string {
  if (!name) return "";
  return masters.byKind[kind]?.find((m) => m.name === name)?.code ?? "";
}

function componentCode(masters: MasterData, system: string, name: string): string {
  if (!name) return "";
  const sc = masters.systemComponents.find(
    (c) => c.system_name === system && c.component_name === name,
  );
  return sc?.component_code ?? "";
}

function relatedCode(
  masters: MasterData,
  system: string,
  component: string,
  related: string,
): string {
  if (!related) return "";
  return (
    masters.relatedComponents.find(
      (r) =>
        r.system_name === system &&
        r.component_name === component &&
        r.related_name === related,
    )?.related_code ?? ""
  );
}

function locationCode(f: FormState, masters: MasterData): string {
  // Compose like RH+F+EX from side+position+zone if location is one of them, else fall back
  // For v1 we use zone code (IN/EX/UB/EN). This matches plant convention.
  const zCode = codeOf(masters, "zone", f.zone);
  return zCode || "NA";
}

export function buildParentCode(f: FormState, masters: MasterData): string {
  const sysC = codeOf(masters, "system", f.system);
  const compC = componentCode(masters, f.system, f.component);
  const relC = relatedCode(masters, f.system, f.component, f.related_component);
  return [sysC, compC, relC].filter(Boolean).join("-");
}

export function buildChildCode(f: FormState, masters: MasterData): string {
  const parent = buildParentCode(f, masters);
  const issueC = codeOf(masters, "issue_type", f.issue_type);
  const failC = codeOf(masters, "failure_mode", f.failure_mode);
  const locC = locationCode(f, masters);
  return [parent, issueC, failC, locC].filter(Boolean).join("-");
}
