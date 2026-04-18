import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableCombo, type ComboOption } from "@/components/SearchableCombo";
import CarModel3D, { type CarMarker } from "@/components/CarModel3D";
import { useMasters } from "@/hooks/useMasters";
import {
  buildChildCode,
  buildDescription,
  buildParentCode,
  emptyForm,
  type FormState,
} from "@/lib/defectLogic";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Check, History, Loader2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const masterToOptions = (rows?: { name: string; code: string }[]): ComboOption[] =>
  (rows ?? []).map((r) => ({ value: r.name, label: r.name, hint: r.code }));

export default function DefectEntryForm() {
  const masters = useMasters();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [quickMode, setQuickMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<null | { count: number }>(null);
  const [history, setHistory] = useState<any[]>([]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Cascading dropdowns
  const systemOptions = useMemo(
    () => masterToOptions(masters.byKind.system),
    [masters.byKind.system],
  );
  const issueOptions = useMemo(
    () => masterToOptions(masters.byKind.issue_type),
    [masters.byKind.issue_type],
  );
  const failureOptions = useMemo(
    () => masterToOptions(masters.byKind.failure_mode),
    [masters.byKind.failure_mode],
  );
  const sourceOptions = useMemo(
    () => masterToOptions(masters.byKind.source),
    [masters.byKind.source],
  );
  const zoneOptions = useMemo(
    () => masterToOptions(masters.byKind.zone),
    [masters.byKind.zone],
  );

  const componentOptions = useMemo<ComboOption[]>(() => {
    if (!form.system) return [];
    return masters.systemComponents
      .filter((c) => c.system_name === form.system)
      .map((c) => ({
        value: c.component_name,
        label: c.component_name,
        hint: c.component_code,
      }));
  }, [masters.systemComponents, form.system]);

  const relatedOptions = useMemo<ComboOption[]>(() => {
    if (!form.system || !form.component) return [];
    return masters.relatedComponents
      .filter(
        (r) => r.system_name === form.system && r.component_name === form.component,
      )
      .map((r) => ({
        value: r.related_name,
        label: r.related_name,
        hint: r.related_code,
      }));
  }, [masters.relatedComponents, form.system, form.component]);

  const suggestion = form.component ? masters.suggestions[form.component] : null;

  // Reset dependent fields when parent changes
  useEffect(() => {
    setForm((f) => ({ ...f, component: "", related_component: "" }));
  }, [form.system]);
  useEffect(() => {
    setForm((f) => ({ ...f, related_component: "" }));
  }, [form.component]);

  // Auto-description (unless user overrode)
  const autoDescription = useMemo(() => buildDescription(form), [form]);
  useEffect(() => {
    if (!form.description_override) {
      setForm((f) => ({ ...f, description_auto: autoDescription }));
    }
  }, [autoDescription, form.description_override]);

  const parentCode = useMemo(
    () => (masters.loading ? "" : buildParentCode(form, masters)),
    [form, masters],
  );
  const childCode = useMemo(
    () => (masters.loading ? "" : buildChildCode(form, masters)),
    [form, masters],
  );

  // Duplicate detection (debounced)
  useEffect(() => {
    if (!childCode || childCode.split("-").length < 4) {
      setDuplicate(null);
      return;
    }
    const t = setTimeout(async () => {
      const { count } = await supabase
        .from("defect_entries")
        .select("id", { count: "exact", head: true })
        .eq("child_code", childCode);
      setDuplicate(count && count > 0 ? { count } : null);
    }, 300);
    return () => clearTimeout(t);
  }, [childCode]);

  // History panel: similar defects (same system+component)
  useEffect(() => {
    if (!form.system || !form.component) {
      setHistory([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("defect_entries")
        .select("id, created_at, vin, model, description_auto, child_code, location")
        .eq("system", form.system)
        .eq("component", form.component)
        .order("created_at", { ascending: false })
        .limit(5);
      setHistory(data ?? []);
    })();
  }, [form.system, form.component]);

  const canSubmit =
    form.system &&
    form.component &&
    form.issue_type &&
    form.failure_mode &&
    !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    const payload = {
      date: form.date,
      source: form.source || null,
      vin: form.vin || null,
      model: form.model || null,
      shop: form.shop || null,
      location: form.location || null,
      zone: form.zone || null,
      sub_zone: form.sub_zone || null,
      system: form.system,
      sub_system: form.sub_system || null,
      component: form.component,
      related_component: form.related_component || null,
      issue_type: form.issue_type,
      failure_mode: form.failure_mode,
      condition: form.condition || null,
      symptom: form.symptom || null,
      description_auto: form.description_auto,
      parent_code: parentCode,
      child_code: childCode,
    };
    const { error } = await supabase.from("defect_entries").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Defect logged",
      description: childCode,
    });
    // Keep VIN/model/shop/source/zone for fast repeat entry
    setForm((f) => ({
      ...emptyForm(),
      date: f.date,
      source: f.source,
      vin: f.vin,
      model: f.model,
      shop: f.shop,
      location: f.location,
      zone: f.zone,
      sub_zone: f.sub_zone,
    }));
  };

  if (masters.loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading masters…
      </div>
    );
  }
  if (masters.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        Failed to load master data: {masters.error}
      </div>
    );
  }

  const onMarkerSelect = (m: CarMarker) => {
    const zoneName =
      m.zone === "EX" ? "EXTERIOR" :
      m.zone === "IN" ? "INTERIOR" :
      m.zone === "EN" ? "ENGINE BAY" : "UNDERBODY";
    setForm((f) => ({ ...f, location: m.code, zone: zoneName }));
    toast({ title: "Location set", description: `${m.code} · ${m.label}` });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-8">
      {/* LEFT: 3D vehicle picker (sticky on desktop) */}
      <aside className="lg:sticky lg:top-4 h-fit space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Vehicle
            </div>
            <h2 className="text-sm font-semibold tracking-tight sm:text-base">
              3D reference
            </h2>
          </div>
          {form.location && (
            <span className="rounded-sm border border-accent bg-accent/5 px-2 py-1 text-[11px] font-mono font-semibold tracking-wider text-accent">
              {form.location}
            </span>
          )}
        </div>
        <CarModel3D selectedCode={form.location} onSelect={onMarkerSelect} className="h-[260px] sm:h-[340px] lg:h-[380px]" />
      </aside>

      {/* RIGHT: Form column */}
      <div className="min-w-0 space-y-6">
        {/* Quick mode + status row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
          <div className="flex items-center gap-3">
            <Switch
              id="quick-mode"
              checked={quickMode}
              onCheckedChange={setQuickMode}
            />
            <Label htmlFor="quick-mode" className="text-xs font-semibold uppercase tracking-wider">
              Quick Entry
            </Label>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className="text-muted-foreground">{form.date}</span>
            {parentCode && (
              <span className="text-muted-foreground">
                P · <span className="text-foreground font-semibold">{parentCode}</span>
              </span>
            )}
            {childCode && (
              <span className="text-muted-foreground">
                C · <span className="text-accent font-semibold">{childCode}</span>
              </span>
            )}
          </div>
        </div>

        {/* Section 1: Basic */}
        {!quickMode && (
          <Section title="1. Basic Info">
            <Field label="Source">
              <SearchableCombo
                options={sourceOptions}
                value={form.source}
                onChange={(v) => set("source", v)}
                placeholder="DVX / SCA / Yard…"
              />
            </Field>
            <Field label="VIN">
              <Input
                className="h-12 text-base"
                value={form.vin}
                onChange={(e) => set("vin", e.target.value.toUpperCase())}
                placeholder="e.g. MA3FB6KS1NB123456"
              />
            </Field>
            <Field label="Model">
              <Input
                className="h-12 text-base"
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="e.g. C3, Aircross"
              />
            </Field>
            <Field label="Shop">
              <Input
                className="h-12 text-base"
                value={form.shop}
                onChange={(e) => set("shop", e.target.value)}
                placeholder="Trim / Chassis / Final"
              />
            </Field>
          </Section>
        )}

        {/* Section 2: Location */}
        {!quickMode && (
          <Section title="2. Location">
            <Field label="Location">
              <Input
                className="h-12 text-base"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. RHFEX, LHRIN"
              />
            </Field>
            <Field label="Zone">
              <SearchableCombo
                options={zoneOptions}
                value={form.zone}
                onChange={(v) => set("zone", v)}
                placeholder="Interior / Exterior…"
              />
            </Field>
            <Field label="Sub-Zone">
              <Input
                className="h-12 text-base"
                value={form.sub_zone}
                onChange={(e) => set("sub_zone", e.target.value)}
                placeholder="optional"
              />
            </Field>
          </Section>
        )}

        {/* Section 3: Classification */}
        <Section title="3. Defect Classification">
          <Field label="System *">
            <SearchableCombo
              options={systemOptions}
              value={form.system}
              onChange={(v) => set("system", v)}
              placeholder="Select system…"
            />
          </Field>
          {!quickMode && (
            <Field label="Sub-System">
              <Input
                className="h-12 text-base"
                value={form.sub_system}
                onChange={(e) => set("sub_system", e.target.value)}
                placeholder="optional"
              />
            </Field>
          )}
          <Field label="Component *" full={quickMode}>
            <SearchableCombo
              options={componentOptions}
              value={form.component}
              onChange={(v) => set("component", v)}
              placeholder={
                form.system ? "Search component…" : "Pick a system first"
              }
              disabled={!form.system}
            />
          </Field>
          {!quickMode && (
            <Field label="Related Component">
              <SearchableCombo
                options={relatedOptions}
                value={form.related_component}
                onChange={(v) => set("related_component", v)}
                placeholder={
                  form.component ? "Optional related part…" : "Pick component first"
                }
                disabled={!form.component || relatedOptions.length === 0}
              />
            </Field>
          )}
        </Section>

        {/* Smart suggestions */}
        {suggestion &&
          (suggestion.top_issues.length > 0 || suggestion.top_failures.length > 0) && (
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Most common for {form.component}
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestion.top_issues.map((iss) => (
                  <button
                    key={"i-" + iss}
                    type="button"
                    onClick={() => set("issue_type", iss)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      form.issue_type === iss
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-card hover:border-accent",
                    )}
                  >
                    {iss}
                  </button>
                ))}
                <span className="text-muted-foreground">·</span>
                {suggestion.top_failures.map((fl) => (
                  <button
                    key={"f-" + fl}
                    type="button"
                    onClick={() => set("failure_mode", fl)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      form.failure_mode === fl
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary",
                    )}
                  >
                    {fl}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Section 4: Details */}
        <Section title="4. Defect Details">
          <Field label="Issue Type *">
            <SearchableCombo
              options={issueOptions}
              value={form.issue_type}
              onChange={(v) => set("issue_type", v)}
              placeholder="Gap / Damage / Leak…"
            />
          </Field>
          <Field label="Failure Mode *">
            <SearchableCombo
              options={failureOptions}
              value={form.failure_mode}
              onChange={(v) => set("failure_mode", v)}
              placeholder="Crack / Missing / Loose…"
            />
          </Field>
          {!quickMode && (
            <>
              <Field label="Symptom">
                <Input
                  className="h-12 text-base"
                  value={form.symptom}
                  onChange={(e) => set("symptom", e.target.value)}
                  placeholder="e.g. Water visible"
                />
              </Field>
              <Field label="Condition">
                <Input
                  className="h-12 text-base"
                  value={form.condition}
                  onChange={(e) => set("condition", e.target.value)}
                  placeholder="e.g. > 5.5mm"
                />
              </Field>
            </>
          )}
        </Section>

        {/* Auto outputs */}
        <Card className="shadow-card-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Auto-Generated Output
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={form.description_override}
                    onCheckedChange={(v) => set("description_override", v)}
                  />
                  Manual override
                </label>
              </div>
              <Textarea
                value={form.description_auto}
                onChange={(e) => set("description_auto", e.target.value)}
                disabled={!form.description_override}
                className="min-h-[60px] resize-none text-base"
                placeholder="Will be generated as you fill the form…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CodeChip label="Parent Code" value={parentCode} />
              <CodeChip label="Child Code" value={childCode} highlight />
            </div>
          </CardContent>
        </Card>

        {/* Duplicate warning */}
        {duplicate && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-warning-foreground">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="text-sm">
              <strong>Possible duplicate:</strong> {duplicate.count} previous
              entr{duplicate.count === 1 ? "y" : "ies"} with the same child code.
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-sm border bg-background/95 p-3 shadow-elevated backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForm(emptyForm())}
            className="h-11 px-5 text-sm font-medium"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="h-11 min-w-44 rounded-sm bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:bg-primary/90"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Submit Defect
          </Button>
        </div>

        {/* History panel — below form */}
        <Card className="shadow-card-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              Recent similar defects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!form.component ? (
              <p className="text-sm text-muted-foreground">
                Pick a Component to see the last 5 similar defects.
              </p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No prior entries for this component yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-md border bg-background/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="code-chip text-xs text-primary truncate">
                        {h.child_code}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{h.description_auto}</p>
                    {(h.vin || h.model || h.location) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[h.vin, h.model, h.location].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [num, ...rest] = title.split(". ");
  const heading = rest.join(". ") || title;
  return (
    <section className="border-t pt-5">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Step {num}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function CodeChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-muted/40",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 code-chip text-base font-bold",
          highlight ? "text-primary-deep" : "text-foreground",
          !value && "text-muted-foreground/60 font-normal italic",
        )}
      >
        {value || "— pending —"}
      </div>
    </div>
  );
}
