import { NextRequest, NextResponse } from 'next/server';

const CANTON_URL = process.env.CANTON_JSON_API_URL || 'http://localhost:7575';
const NAMESPACE = '12203e76b582b4c420f1e6ee4d1992042e9e5e1bacff0166fc4e87764459aea1d771';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || 'a60b6d5c583f91e98770e754fe71d1fbc737b36bb9b2ff5d4911dd86ad79358b';

function makeToken(actAs: string, readAs?: string[]) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    'https://daml.com/ledger-api': {
      ledgerId: 'sandbox',
      applicationId: 'growstreams-demo',
      actAs: [actAs],
      readAs: readAs ?? [actAs],
    },
  })).toString('base64url');
  return `${header}.${payload}.`;
}

function partyForName(name: string): string {
  const map: Record<string, string> = {
    Admin: `Admin::${NAMESPACE}`,
    Alice: `Alice::${NAMESPACE}`,
    Bob: `Bob::${NAMESPACE}`,
  };
  return map[name] ?? name;
}

export async function POST(req: NextRequest) {
  const { party, templateId, contractId, choice, argument } = await req.json();
  const partyId = partyForName(party);
  const fullTemplateId = `${PACKAGE_ID}:${templateId}`;
  const token = makeToken(partyId, [
    `Alice::${NAMESPACE}`,
    `Bob::${NAMESPACE}`,
    `Admin::${NAMESPACE}`,
  ]);

  const res = await fetch(`${CANTON_URL}/v1/exercise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ templateId: fullTemplateId, contractId, choice, argument }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
