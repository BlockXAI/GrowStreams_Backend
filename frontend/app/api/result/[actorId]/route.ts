import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, this would query Supabase/PostgreSQL
const mockResults = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actorId: string }> }
) {
  try {
    const { actorId } = await params;

    // TODO: Query from database
    // const result = await supabase
    //   .from('campaign_results')
    //   .select('*')
    //   .eq('actor_id', actorId)
    //   .single();

    const result = mockResults.get(actorId);

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}

// Helper function to store result (called after analysis)
// Keep this as an internal helper (do not export) so the route module
// only exports allowed HTTP method handlers for Next.js.
async function storeResult(actorId: string, analysisData: any) {
  // TODO: Store in database
  // await supabase.from('campaign_results').insert({
  //   actor_id: actorId,
  //   ...analysisData,
  //   created_at: new Date().toISOString(),
  // });

  mockResults.set(actorId, analysisData);
}
