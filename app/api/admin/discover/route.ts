import { NextResponse } from 'next/server';
import { discoverAiOcmLists } from '@/lib/clickup';

export async function GET() {
  try {
    const lists = await discoverAiOcmLists();
    return NextResponse.json({
      message: 'AI OCM lists discovered successfully. Add these to your .env:',
      lists,
      envVars: {
        CLICKUP_ROADSHOWS_LIST_ID: lists.roadshows,
        CLICKUP_WIDGET_LIST_ID: lists.widget,
        CLICKUP_UCOP_LIST_ID: lists.ucopAiCouncil,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
