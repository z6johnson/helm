import { NextRequest, NextResponse } from 'next/server';
import { getCachedTasks, getManualMeasurements, setManualMeasurements } from '@/lib/cache';
import { getCurrentQuarter, buildMeasurementPayload } from '@/lib/measurements';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter') || getCurrentQuarter();

    const cached = await getCachedTasks();
    const tasks = cached?.tasks ?? [];
    const manual = await getManualMeasurements(quarter);

    const payload = buildMeasurementPayload(tasks, manual, quarter);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { quarter, values } = body as {
      quarter: string;
      values: Record<string, number | null>;
    };

    if (!quarter || !values) {
      return NextResponse.json(
        { error: 'Missing quarter or values' },
        { status: 400 }
      );
    }

    const existing = (await getManualMeasurements(quarter)) ?? {};
    const merged = { ...existing, ...values, _lastUpdated: Date.now() };
    await setManualMeasurements(quarter, merged);

    return NextResponse.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
