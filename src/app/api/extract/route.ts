import { NextRequest, NextResponse } from 'next/server';
import { checkSameOrigin } from '@/lib/apiSecurity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: 'This endpoint requires a same-origin request or an authenticated session.' },
      { status: 401 },
    );
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No PDF file was uploaded.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'Only PDF files can be processed by this endpoint.' }, { status: 415 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'The PDF is larger than the 10 MB limit.' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const extracted = textContent.items
    .map((item: unknown) => (typeof item === 'object' && item !== null && 'str' in item ? (item as { str?: string }).str ?? '' : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (extracted.length < 20) {
    return NextResponse.json(
      { success: false, error: 'The PDF has no extractable text layer. For scanned documents, run OCR first or paste the copy.' },
      { status: 422 },
    );
  }

  return NextResponse.json({
    success: true,
    text: extracted,
    fileName: file.name,
    pageCount: page ? await pdf.numPages : 1,
  });
}
