/**
 * /api/ai/sql — Байгалийн хэлээр асуулт → SQL/Python/Table/Compare хөрвүүлэлт
 * OpenAI GPT-5.1 ашиглана. OPENAI_API_KEY env var шаардлагатай.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAISystemPrompt, type AIFormat } from '@/lib/aiContext';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MODEL = 'gpt-5.1';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface AIResponse {
  format?: AIFormat;
  sql?: string;
  python?: string;
  leftSql?: string;
  rightSql?: string;
  leftLabel?: string;
  rightLabel?: string;
  explanation?: string;
  chartHint?: string;
  columns?: string[];
  error?: string;
}

const VALID_FORMATS: AIFormat[] = ['sql', 'python', 'compare', 'table'];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'OPENAI_API_KEY тохируулагдаагүй',
      suggestion: 'Серверийн админ env-д API key оруулна уу',
    }, { status: 500 });
  }

  let body: { question: string; format?: AIFormat };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const question = body.question?.trim();
  const format: AIFormat = VALID_FORMATS.includes(body.format as AIFormat) ? body.format as AIFormat : 'sql';

  if (!question) {
    return NextResponse.json({ ok: false, error: 'Асуулт хоосон байна' }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ ok: false, error: 'Асуулт хэт урт (500 тэмдэгт хязгаар)' }, { status: 400 });
  }

  const start = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildAISystemPrompt(format) },
          { role: 'user', content: question },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({
        ok: false,
        error: `OpenAI API алдаа: ${res.status}`,
        detail: errText.slice(0, 300),
      }, { status: 502 });
    }

    const json = await res.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? '';

    // JSON задлах — code-fence-той эсвэл шууд
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let parsed: AIResponse;
    try { parsed = JSON.parse(cleaned); }
    catch {
      return NextResponse.json({
        ok: false,
        error: 'AI хариу JSON биш байна',
        raw: text.slice(0, 300),
      }, { status: 502 });
    }

    if (parsed.error) {
      return NextResponse.json({ ok: false, error: parsed.error, needsClarification: true });
    }

    // Format-аас хамаарсан validation
    const blocked = /\b(DROP|DELETE|ALTER|CREATE|INSERT|UPDATE|TRUNCATE|GRANT|REVOKE)\b/i;

    if (format === 'compare') {
      if (!parsed.leftSql || !parsed.rightSql) {
        return NextResponse.json({ ok: false, error: 'AI харьцуулалтын хоёр SQL үүсгэж чадсангүй' }, { status: 502 });
      }
      if (blocked.test(parsed.leftSql) || blocked.test(parsed.rightSql)) {
        return NextResponse.json({ ok: false, error: 'Зөвхөн SELECT зөвшөөрөгдөнө' }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        format: 'compare',
        leftSql: parsed.leftSql,
        rightSql: parsed.rightSql,
        leftLabel: parsed.leftLabel ?? 'Зүүн',
        rightLabel: parsed.rightLabel ?? 'Баруун',
        explanation: parsed.explanation ?? '',
        timing: { totalMs: Date.now() - start },
      });
    }

    if (format === 'python') {
      if (!parsed.python || !parsed.sql) {
        return NextResponse.json({ ok: false, error: 'AI Python код үүсгэж чадсангүй' }, { status: 502 });
      }
      if (blocked.test(parsed.sql)) {
        return NextResponse.json({ ok: false, error: 'Зөвхөн SELECT зөвшөөрөгдөнө' }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        format: 'python',
        sql: parsed.sql,
        python: parsed.python,
        explanation: parsed.explanation ?? '',
        timing: { totalMs: Date.now() - start },
      });
    }

    // sql эсвэл table
    if (!parsed.sql) {
      return NextResponse.json({ ok: false, error: 'AI SQL үүсгэж чадсангүй' }, { status: 502 });
    }
    if (blocked.test(parsed.sql)) {
      return NextResponse.json({ ok: false, error: 'Зөвхөн SELECT зөвшөөрөгдөнө' }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      format,
      sql: parsed.sql,
      explanation: parsed.explanation ?? '',
      chartHint: parsed.chartHint ?? null,
      columns: parsed.columns ?? null,
      timing: { totalMs: Date.now() - start },
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'AI хүсэлт амжилтгүй',
    }, { status: 500 });
  }
}
