import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // Ensure there is a body
  if (!request.body) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    console.log(`📤 Attempting upload for: ${filename}`);
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    console.log(`✅ Upload success: ${blob.url}`);
    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('❌ BLOB UPLOAD CRASHED:', error.message);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
