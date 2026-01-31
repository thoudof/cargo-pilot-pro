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

    // Fetch financial data with related entities
    let tripsQuery = supabase
      .from("trips")
      .select("*, trip_expenses(*), drivers(*), vehicles(*), routes(*), contractors(*), cargo_types(*)");

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

    // Filter out cancelled trips for revenue calculations (they won't generate income)
    const activeTrips = trips?.filter((t) => t.status !== "cancelled") || [];
    const cancelledTrips = trips?.filter((t) => t.status === "cancelled") || [];

    // Calculate financial metrics (excluding cancelled trips from revenue)
    const totalTrips = trips?.length || 0;
    const activeTripsCount = activeTrips.length;
    const cancelledTripsCount = cancelledTrips.length;
    const completedTrips = activeTrips.filter((t) => t.status === "completed").length;
    const inProgressTrips = activeTrips.filter((t) => t.status === "in_progress").length;
    const plannedTrips = activeTrips.filter((t) => t.status === "planned").length;
    
    // Revenue only from non-cancelled trips
    const totalRevenue = activeTrips.reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0);
    const completedRevenue = activeTrips
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0);
    const pendingRevenue = activeTrips
      .filter((t) => t.status !== "completed")
      .reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0);
    
    // Expenses from all non-cancelled trips
    const totalExpenses = activeTrips.reduce((sum, t) => {
      const tripExpenses = t.trip_expenses?.reduce((expSum: number, exp: any) => expSum + (Number(exp.amount) || 0), 0) || 0;
      return sum + tripExpenses;
    }, 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
    const completionRate = activeTripsCount > 0 ? ((completedTrips / activeTripsCount) * 100).toFixed(1) : 0;

    // Expense breakdown by category
    const expensesByCategory: Record<string, number> = {};
    activeTrips.forEach((trip) => {
      trip.trip_expenses?.forEach((exp: any) => {
        const category = exp.category || "other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + (Number(exp.amount) || 0);
      });
    });

    // Calculate average expense per trip
    const avgExpensePerTrip = completedTrips > 0 ? (totalExpenses / completedTrips).toFixed(0) : 0;
    const avgRevenuePerTrip = completedTrips > 0 ? (completedRevenue / completedTrips).toFixed(0) : 0;

    // Monthly trends (excluding cancelled)
    const monthlyData: Record<string, { revenue: number; expenses: number; trips: number; completed: number }> = {};
    activeTrips.forEach((trip) => {
      const month = new Date(trip.departure_date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0, trips: 0, completed: 0 };
      }
      monthlyData[month].revenue += Number(trip.cargo_value) || 0;
      monthlyData[month].trips += 1;
      if (trip.status === "completed") {
        monthlyData[month].completed += 1;
      }
      trip.trip_expenses?.forEach((exp: any) => {
        monthlyData[month].expenses += Number(exp.amount) || 0;
      });
    });

    // Route analysis
    const routeStats: Record<string, { count: number; revenue: number; avgValue: number }> = {};
    activeTrips.forEach((trip) => {
      const routeKey = `${trip.point_a} → ${trip.point_b}`;
      if (!routeStats[routeKey]) {
        routeStats[routeKey] = { count: 0, revenue: 0, avgValue: 0 };
      }
      routeStats[routeKey].count += 1;
      routeStats[routeKey].revenue += Number(trip.cargo_value) || 0;
    });
    Object.keys(routeStats).forEach((key) => {
      routeStats[key].avgValue = routeStats[key].count > 0 
        ? Math.round(routeStats[key].revenue / routeStats[key].count) 
        : 0;
    });

    // Top routes by revenue
    const topRoutes = Object.entries(routeStats)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5);

    // Contractor analysis
    const contractorStats: Record<string, { name: string; count: number; revenue: number }> = {};
    activeTrips.forEach((trip) => {
      if (trip.contractor_id && trip.contractors) {
        const contractorId = trip.contractor_id;
        if (!contractorStats[contractorId]) {
          contractorStats[contractorId] = { 
            name: trip.contractors.company_name || "Неизвестный", 
            count: 0, 
            revenue: 0 
          };
        }
        contractorStats[contractorId].count += 1;
        contractorStats[contractorId].revenue += Number(trip.cargo_value) || 0;
      }
    });

    // Top contractors
    const topContractors = Object.entries(contractorStats)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5);

    // Driver performance
    const driverStats: Record<string, { name: string; trips: number; completed: number; revenue: number }> = {};
    activeTrips.forEach((trip) => {
      if (trip.driver_id && trip.drivers) {
        const driverId = trip.driver_id;
        if (!driverStats[driverId]) {
          driverStats[driverId] = { 
            name: trip.drivers.name || trip.driver_name || "Неизвестный", 
            trips: 0, 
            completed: 0,
            revenue: 0 
          };
        }
        driverStats[driverId].trips += 1;
        if (trip.status === "completed") {
          driverStats[driverId].completed += 1;
        }
        driverStats[driverId].revenue += Number(trip.cargo_value) || 0;
      }
    });

    // Cargo analysis
    const cargoStats: Record<string, { name: string; count: number; totalWeight: number; totalVolume: number; revenue: number }> = {};
    activeTrips.forEach((trip) => {
      if (trip.cargo_type_id && trip.cargo_types) {
        const cargoId = trip.cargo_type_id;
        if (!cargoStats[cargoId]) {
          cargoStats[cargoId] = { 
            name: trip.cargo_types.name || "Неизвестный", 
            count: 0, 
            totalWeight: 0,
            totalVolume: 0,
            revenue: 0 
          };
        }
        cargoStats[cargoId].count += 1;
        cargoStats[cargoId].totalWeight += Number(trip.cargo_weight) || 0;
        cargoStats[cargoId].totalVolume += Number(trip.cargo_volume) || 0;
        cargoStats[cargoId].revenue += Number(trip.cargo_value) || 0;
      }
    });

    const financialSummary = {
      totalTrips,
      activeTripsCount,
      cancelledTripsCount,
      completedTrips,
      inProgressTrips,
      plannedTrips,
      completionRate,
      totalRevenue,
      completedRevenue,
      pendingRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      avgExpensePerTrip,
      avgRevenuePerTrip,
      expensesByCategory,
      monthlyData,
      topRoutes,
      topContractors: topContractors.map(([, stats]) => stats),
      driverStats: Object.values(driverStats),
      cargoStats: Object.values(cargoStats),
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

    // Format data for AI prompt
    const topRoutesFormatted = topRoutes
      .map(([route, stats]) => `  - ${route}: ${stats.count} рейсов, выручка ${stats.revenue.toLocaleString("ru-RU")} ₽, средний чек ${stats.avgValue.toLocaleString("ru-RU")} ₽`)
      .join("\n");

    const topContractorsFormatted = topContractors
      .map(([, stats]) => `  - ${stats.name}: ${stats.count} рейсов, выручка ${stats.revenue.toLocaleString("ru-RU")} ₽`)
      .join("\n");

    const driverStatsFormatted = Object.values(driverStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((d) => `  - ${d.name}: ${d.trips} рейсов (${d.completed} завершено), выручка ${d.revenue.toLocaleString("ru-RU")} ₽`)
      .join("\n");

    const cargoStatsFormatted = Object.values(cargoStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((c) => `  - ${c.name}: ${c.count} рейсов, ${c.totalWeight.toLocaleString("ru-RU")} кг, выручка ${c.revenue.toLocaleString("ru-RU")} ₽`)
      .join("\n");

    const userPrompt = `Проанализируй финансовую ситуацию логистической компании. ВАЖНО: Отменённые рейсы исключены из расчётов выручки, так как по ним оплата не поступит.

📊 ОБЩАЯ СТАТИСТИКА РЕЙСОВ:
- Всего рейсов в системе: ${totalTrips}
- Активных рейсов (без отменённых): ${activeTripsCount}
- Отменённых рейсов: ${cancelledTripsCount}
- Завершённых: ${completedTrips}
- В пути: ${inProgressTrips}
- Запланировано: ${plannedTrips}
- Коэффициент завершения: ${completionRate}%

💰 ФИНАНСОВЫЕ ПОКАЗАТЕЛИ (только активные рейсы):
- Общая плановая выручка: ${totalRevenue.toLocaleString("ru-RU")} ₽
- Подтверждённая выручка (завершённые): ${completedRevenue.toLocaleString("ru-RU")} ₽
- Ожидаемая выручка (незавершённые): ${pendingRevenue.toLocaleString("ru-RU")} ₽
- Общие расходы: ${totalExpenses.toLocaleString("ru-RU")} ₽
- Чистая прибыль: ${netProfit.toLocaleString("ru-RU")} ₽
- Рентабельность: ${profitMargin}%
- Средняя выручка на рейс: ${avgRevenuePerTrip} ₽
- Средние расходы на рейс: ${avgExpensePerTrip} ₽

📈 СТРУКТУРА РАСХОДОВ ПО КАТЕГОРИЯМ:
${Object.entries(expensesByCategory).length > 0 
  ? Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([cat, amount]) => {
        const percentage = totalExpenses > 0 ? ((amount as number / totalExpenses) * 100).toFixed(1) : 0;
        return `- ${cat}: ${(amount as number).toLocaleString("ru-RU")} ₽ (${percentage}%)`;
      })
      .join("\n")
  : "- Расходы не зафиксированы"}

📅 ДИНАМИКА ПО МЕСЯЦАМ:
${Object.entries(monthlyData).length > 0
  ? Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const monthProfit = data.revenue - data.expenses;
        const monthMargin = data.revenue > 0 ? ((monthProfit / data.revenue) * 100).toFixed(1) : 0;
        return `- ${month}: ${data.trips} рейсов (${data.completed} завершено), выручка ${data.revenue.toLocaleString("ru-RU")} ₽, расходы ${data.expenses.toLocaleString("ru-RU")} ₽, прибыль ${monthProfit.toLocaleString("ru-RU")} ₽ (${monthMargin}%)`;
      })
      .join("\n")
  : "- Нет данных за период"}

🛣️ ТОП-5 МАРШРУТОВ ПО ВЫРУЧКЕ:
${topRoutesFormatted || "- Нет данных о маршрутах"}

🏢 ТОП-5 ЗАКАЗЧИКОВ ПО ВЫРУЧКЕ:
${topContractorsFormatted || "- Нет данных о заказчиках"}

👨‍✈️ СТАТИСТИКА ПО ВОДИТЕЛЯМ (ТОП-5):
${driverStatsFormatted || "- Нет данных о водителях"}

📦 СТАТИСТИКА ПО ТИПАМ ГРУЗОВ (ТОП-5):
${cargoStatsFormatted || "- Нет данных о грузах"}

На основе этих данных:
1. Оцени общее финансовое здоровье компании
2. Выяви проблемные области и риски
3. Определи наиболее прибыльные направления
4. Дай конкретные рекомендации по оптимизации
5. Предложи план действий на ближайший период`;

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
