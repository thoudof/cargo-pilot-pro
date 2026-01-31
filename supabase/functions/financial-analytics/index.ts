import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, dateRange } = await req.json();

    // Fetch financial data
    let tripsQuery = supabase
      .from("trips")
      .select("*, trip_expenses(*)");

    if (dateRange?.from) {
      tripsQuery = tripsQuery.gte("departure_date", dateRange.from);
    }
    if (dateRange?.to) {
      tripsQuery = tripsQuery.lte("departure_date", dateRange.to);
    }

    const { data: trips, error: tripsError } = await tripsQuery;
    if (tripsError) {
      console.error("Error fetching trips:", tripsError);
      throw new Error("Failed to fetch trips data");
    }

    // Calculate financial metrics
    const totalTrips = trips?.length || 0;
    const completedTrips = trips?.filter((t) => t.status === "completed").length || 0;
    const totalRevenue = trips?.reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0) || 0;
    const totalExpenses = trips?.reduce((sum, t) => {
      const tripExpenses = t.trip_expenses?.reduce((expSum: number, exp: any) => expSum + (Number(exp.amount) || 0), 0) || 0;
      return sum + tripExpenses;
    }, 0) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Expense breakdown by category
    const expensesByCategory: Record<string, number> = {};
    trips?.forEach((trip) => {
      trip.trip_expenses?.forEach((exp: any) => {
        const category = exp.category || "other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + (Number(exp.amount) || 0);
      });
    });

    // Monthly trends
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    trips?.forEach((trip) => {
      const month = new Date(trip.departure_date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      monthlyData[month].revenue += Number(trip.cargo_value) || 0;
      trip.trip_expenses?.forEach((exp: any) => {
        monthlyData[month].expenses += Number(exp.amount) || 0;
      });
    });

    const financialSummary = {
      totalTrips,
      completedTrips,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expensesByCategory,
      monthlyData,
    };

    if (action === "get_summary") {
      return new Response(JSON.stringify(financialSummary), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI Analysis
    const systemPrompt = `Ты — эксперт по финансовой аналитике для транспортной логистической компании. 
Анализируй предоставленные финансовые данные и давай конкретные рекомендации на русском языке.

Твои ответы должны быть:
1. Структурированными и понятными
2. С конкретными цифрами и процентами
3. С практическими рекомендациями по оптимизации
4. Учитывать специфику транспортной логистики

Формат ответа:
- Используй заголовки с ##
- Используй списки для рекомендаций
- Выделяй важные цифры
- Давай приоритизированные действия`;

    const userPrompt = `Проанализируй финансовую ситуацию логистической компании:

📊 ОБЩАЯ СТАТИСТИКА:
- Всего рейсов: ${totalTrips}
- Завершённых: ${completedTrips}
- Коэффициент завершения: ${totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0}%

💰 ФИНАНСОВЫЕ ПОКАЗАТЕЛИ:
- Общая выручка: ${totalRevenue.toLocaleString("ru-RU")} ₽
- Общие расходы: ${totalExpenses.toLocaleString("ru-RU")} ₽
- Чистая прибыль: ${netProfit.toLocaleString("ru-RU")} ₽
- Рентабельность: ${profitMargin}%

📈 РАСХОДЫ ПО КАТЕГОРИЯМ:
${Object.entries(expensesByCategory)
  .map(([cat, amount]) => `- ${cat}: ${amount.toLocaleString("ru-RU")} ₽`)
  .join("\n")}

📅 ДИНАМИКА ПО МЕСЯЦАМ:
${Object.entries(monthlyData)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([month, data]) => `- ${month}: выручка ${data.revenue.toLocaleString("ru-RU")} ₽, расходы ${data.expenses.toLocaleString("ru-RU")} ₽`)
  .join("\n")}

Дай детальный анализ и рекомендации по улучшению финансовой ситуации.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Требуется пополнение баланса" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Financial analytics error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
