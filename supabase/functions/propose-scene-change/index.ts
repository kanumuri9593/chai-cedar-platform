import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequestBody = {
  propertyId?: string;
  prompt: string;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Missing Authorization header", { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  if (!body.prompt?.trim()) {
    return new Response("Missing prompt", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const scenePatch = {
    version: 1,
    source: "propose-scene-change",
    operations: [
      {
        op: "draft_note",
        prompt: body.prompt,
        guardrail: "Owner review required before activation"
      }
    ]
  };

  const changeSummary =
    "AI draft captured. Connect OPENAI_API_KEY here to expand this into structured object moves, material changes, cost notes, and risk notes.";

  const { data, error } = await supabase
    .from("scenario_versions")
    .insert({
      property_id: body.propertyId ?? null,
      title: "AI draft scenario",
      state: "draft",
      prompt: body.prompt,
      change_summary: changeSummary,
      estimated_impact: "Pending detailed model analysis.",
      scene_patch: scenePatch,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ scenario: data });
});
