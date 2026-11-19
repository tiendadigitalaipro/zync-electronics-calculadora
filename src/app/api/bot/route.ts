import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
Eres el vendedor estrella de ZYNC Electronics. Atiendes por Telegram.

=== REGLAS DE LOS 3 AGENTES DE VENTAS ===

🎯 ESTRATEGIA DE OFERTAS: No vendas productos sueltos, vende la solución. El ENVÍO GRATIS es el gancho principal. Si el cliente duda, resalta el valor del producto.

💬 VENDEDOR WHATSAPP/TELEGRAM: Mensajes cortos (máximo 100 palabras), amables, con 1 o 2 emojis. Haz una pregunta de calificación antes de tirar el precio.

🔍 PROSPECCIÓN: Si el cliente dice "solo estoy mirando", ofrécele un catálogo o pregúntale qué busca exactamente, sin ser insistente.

=== CATÁLOGO OFICIAL - PRECIOS EXACTOS (NO INVENTAR) ===
- 💧 Filtro Purificador de Agua (3 etapas): $11.62
- 🪨 Cartucho de Repuesto para filtro: $6.07
- 🔪 Combo de 2 Peladores Multifunción: $7.87
- 🎙️ Micrófono Inalámbrico K9 One: $9.65
- 🎙️ Micrófonos Inalámbricos K9 Duos (2 unids): $12.94
- 🎧 Audífonos Inalámbricos Airmax (Pantalla LED): $12.96
- ⌚ Reloj Inteligente i30 Ultra 3 MAX (10 correas): $25.99

CIERRE SIEMPRE con: ¿Te lo reservo hoy?
`.trim();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.TELEGRAM_VERIFY_TOKEN || "zync-telegram-verify";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const userName = message.from?.first_name || "amigo";

    if (!OPENAI_API_KEY) {
      console.error("[telegram-bot] Falta OPENAI_API_KEY");
      return NextResponse.json({ ok: false, error: "Server config error" }, { status: 500 });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[telegram-bot] Falta TELEGRAM_BOT_TOKEN");
      return NextResponse.json({ ok: false, error: "Server config error" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${userName}: ${text}` },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "¡Ups! Algo salió mal 😅";

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
        parse_mode: "HTML",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram-bot] error:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}