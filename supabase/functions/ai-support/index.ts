// SHOOTERS BET — AI Support Assistant
// Streams responses from Lovable AI Gateway. Uses caller's JWT to authorize and
// has access to user profile + open matches + user's bets to give grounded help.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are SHOOTERS BET's professional support AI. SHOOTERS BET is a virtual-token gun-fight betting platform between gangs and factions. You help users with:
- Today's matches & upcoming events
- Suggesting odds & bet strategies (NEVER guarantee wins)
- How to request tokens, place a bet, edit a bet, or cash out
- Booking codes (8-char shareable codes)
- Roles: admin, moderator, gang_leader, shooter, registered, viewer

RULES:
- You CANNOT grant tokens. Only admins can. If a user asks for tokens, tell them how to submit a request via /tokens.
- If a question is escalated or you can't resolve it, suggest opening a ticket and the admin will reply.
- Be concise, professional, and use markdown.
- All winnings are virtual tokens — no real money.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages, conversation_id, ticket_id } = await req.json();

    // Pull context for the model
    const [{ data: profile }, { data: openMatches }, { data: myOpenBets }] = await Promise.all([
      supabase.from("profiles").select("full_name, token_balance, country, gang_faction, gang_type, server").eq("id", user.id).maybeSingle(),
      supabase.from("matches").select("id, league, location, kickoff_time, status, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)").in("status", ["upcoming", "live"]).order("kickoff_time").limit(15),
      supabase.from("bets").select("booking_code, stake, total_odds, potential_payout, status").eq("user_id", user.id).eq("status", "open").limit(10),
    ]);

    const context = `\n\nCURRENT USER:\n${JSON.stringify(profile)}\n\nOPEN/UPCOMING MATCHES:\n${JSON.stringify(openMatches)}\n\nUSER'S OPEN BETS:\n${JSON.stringify(myOpenBets)}\n`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT + context }, ...messages],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Contact admin." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "AI failed", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const reply: string = j.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
    const last = messages[messages.length - 1]?.content ?? "";

    // Persist + log
    if (conversation_id) {
      await supabase.from("ai_messages").insert([
        { conversation_id, role: "user", content: last },
        { conversation_id, role: "assistant", content: reply },
      ]);
    }
    await supabase.from("ai_logs").insert({
      user_id: user.id,
      conversation_id: conversation_id ?? null,
      ticket_id: ticket_id ?? null,
      kind: ticket_id ? "ticket" : "support_chat",
      model: "google/gemini-2.5-flash",
      prompt_preview: String(last).slice(0, 500),
      response_preview: reply.slice(0, 500),
    });

    // If this is on a ticket, also persist as ticket message
    if (ticket_id) {
      // assistant pseudo-user-id = current user's id for RLS; mark via content prefix
      await supabase.from("ticket_messages").insert({ ticket_id, user_id: user.id, content: `🤖 AI: ${reply}` });
    }

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
