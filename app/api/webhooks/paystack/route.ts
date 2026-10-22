import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 });
  }

  const bodyText = await req.text();
  const hash = crypto.createHmac('sha512', secret).update(bodyText).digest('hex');
  const signature = req.headers.get('x-paystack-signature');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(bodyText);
  
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const txn = verifyData.data;
    
    const treasuryRecord = {
      business_id: '2069411',
      business_name: 'Warri Fresh Fish Paystack',
      provider: 'PAYSTACK',
      provider_reference: txn.reference,
      amount: txn.amount / 100,
      fees: txn.fees / 100,
      net_amount: (txn.amount - txn.fees) / 100,
      currency: txn.currency,
      customer_email: txn.customer.email,
      channel: txn.channel,
      status: 'VERIFIED',
      direction: 'CREDIT',
      source_of_funds: 'PAYSTACK_DVA',
      account_id: 'warri_fresh_fish_2069411',
      creator_id: 'RAY_WHIT_ETABUKU',
      payout_account: '7047108143',
      payout_bank: 'OPay Digital Services',
      payment_page: 'https://paystack.shop/pay/fop77k74j5',
      verified_at: new Date().toISOString(),
      raw: txn
    };

    console.log('FLUXPAY TREASURY CREDIT:', treasuryRecord);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Warri Fresh Fish Webhook Live',
    business_id: '2069411',
    payment_page: 'https://paystack.shop/pay/fop77k74j5',
    payout: '7047108143 OPay',
    rule: 'Webhook or Polling is Truth'
  });
}
