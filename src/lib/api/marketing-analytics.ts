import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export interface MarketingAnalytics {
  totals: {
    forms: number;
    views: number;
    submissions: number;
    leads: number;
    conversionRate: number; // %
    avgScore: number;
    duplicateRate: number; // %
  };
  perForm: Array<{ id: string; name: string; views: number; submissions: number; conversion: number }>;
  byUtmSource: Array<{ source: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  scoreBuckets: Array<{ bucket: string; count: number }>;
}

function emptyAnalytics(): MarketingAnalytics {
  return {
    totals: { forms: 0, views: 0, submissions: 0, leads: 0, conversionRate: 0, avgScore: 0, duplicateRate: 0 },
    perForm: [],
    byUtmSource: [],
    byDevice: [],
    byDay: [],
    scoreBuckets: [],
  };
}

function bucketForScore(score: number): string {
  if (score <= 25) return "0–25";
  if (score <= 50) return "26–50";
  if (score <= 75) return "51–75";
  return "76–100";
}

export async function fetchMarketingAnalytics(): Promise<MarketingAnalytics> {
  if (!isSupabaseConfigured) return emptyAnalytics();
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [formsRes, leadsRes] = await Promise.all([
    supabase
      .from("marketing_forms")
      .select("id, name, total_views, total_submissions")
      .eq("tenant_id", tenantId),
    supabase
      .from("crm_negotiation_marketing")
      .select("form_id, score, utm_source, device_type, is_duplicate, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  if (formsRes.error) throw new Error(formsRes.error.message);
  if (leadsRes.error) throw new Error(leadsRes.error.message);

  const forms = (formsRes.data ?? []) as Array<Record<string, unknown>>;
  const leads = (leadsRes.data ?? []) as Array<Record<string, unknown>>;

  const perForm = forms.map((f) => {
    const views = Number(f.total_views ?? 0);
    const submissions = Number(f.total_submissions ?? 0);
    return {
      id: String(f.id),
      name: String(f.name ?? ""),
      views,
      submissions,
      conversion: views > 0 ? Math.round((submissions / views) * 1000) / 10 : 0,
    };
  });

  const totalViews = perForm.reduce((s, f) => s + f.views, 0);
  const totalSubmissions = perForm.reduce((s, f) => s + f.submissions, 0);

  const utmMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  const scoreMap = new Map<string, number>();
  let scoreSum = 0;
  let duplicateCount = 0;

  for (const lead of leads) {
    const src = String(lead.utm_source ?? "").trim() || "(direto)";
    utmMap.set(src, (utmMap.get(src) ?? 0) + 1);

    const dev = String(lead.device_type ?? "").trim() || "desconhecido";
    deviceMap.set(dev, (deviceMap.get(dev) ?? 0) + 1);

    const created = String(lead.created_at ?? "");
    const day = created.slice(0, 10);
    if (day) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);

    const score = Number(lead.score ?? 0);
    scoreSum += score;
    const b = bucketForScore(score);
    scoreMap.set(b, (scoreMap.get(b) ?? 0) + 1);

    if (lead.is_duplicate === true) duplicateCount++;
  }

  const leadCount = leads.length;
  const byDay = Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([day, count]) => ({ day: day.slice(5), count }));

  return {
    totals: {
      forms: forms.length,
      views: totalViews,
      submissions: totalSubmissions,
      leads: leadCount,
      conversionRate: totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 1000) / 10 : 0,
      avgScore: leadCount > 0 ? Math.round(scoreSum / leadCount) : 0,
      duplicateRate: leadCount > 0 ? Math.round((duplicateCount / leadCount) * 1000) / 10 : 0,
    },
    perForm: perForm.sort((a, b) => b.submissions - a.submissions),
    byUtmSource: Array.from(utmMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    byDevice: Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count })),
    byDay,
    scoreBuckets: ["0–25", "26–50", "51–75", "76–100"].map((bucket) => ({
      bucket,
      count: scoreMap.get(bucket) ?? 0,
    })),
  };
}

export function useMarketingAnalytics(
  options?: Omit<UseQueryOptions<MarketingAnalytics>, "queryKey" | "queryFn">,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: ["marketing-analytics"],
    queryFn: fetchMarketingAnalytics,
    enabled: (enabledOption ?? true) && isSupabaseConfigured,
    staleTime: 60_000,
  });
}
