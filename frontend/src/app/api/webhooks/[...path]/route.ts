import { NextRequest, NextResponse } from 'next/server';

const defaultBackendUrl = process.env.NODE_ENV !== 'production'
  ? 'http://localhost:5000'
  : 'https://traffic-analytics-api.fireup-dist.workers.dev';
const backendUrl = process.env.BACKEND_INTERNAL_URL || defaultBackendUrl;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${backendUrl}/api/webhooks/${path}${search}`;

  try {
    const res = await fetch(targetUrl, {
      headers: { ...Object.fromEntries(request.headers.entries()) },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'text/plain',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Server backend (port 5000) sedang offline atau tidak dapat dijangkau: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${backendUrl}/api/webhooks/${path}${search}`;

  try {
    const bodyText = await request.text();
    const forwardHeaders = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'Cookie': request.headers.get('cookie') || '',
      'Authorization': request.headers.get('authorization') || '',
    };
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers: forwardHeaders,
        body: bodyText,
      });
    } catch {
      // Fallback ke production Cloudflare Workers jika port 5000 lokal tidak aktif
      const fallbackUrl = `https://traffic-analytics-api.fireup-dist.workers.dev/api/webhooks/${path}${search}`;
      res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: forwardHeaders,
        body: bodyText,
      });
    }

    const resText = await res.text();
    let data;
    try {
      data = JSON.parse(resText);
    } catch {
      data = { raw: resText };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Server backend sedang offline atau tidak dapat dijangkau: ${err.message}` },
      { status: 502 }
    );
  }
}
