import { NextRequest, NextResponse } from 'next/server';
import { fetchComments, addComment } from '@/lib/clickup';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await fetchComments(params.id);
    return NextResponse.json({ comments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const comment = await addComment(params.id, text);
    return NextResponse.json(comment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
