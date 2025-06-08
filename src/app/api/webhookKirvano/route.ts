
import { NextResponse } from 'next/server';
import { db, collection, query, where, getDocs, writeBatch, doc, Timestamp } from '@/lib/firebase';

// It's highly recommended to move this token to an environment variable
// e.g., process.env.KIRVANO_WEBHOOK_TOKEN
const KIRVANO_SECRET_TOKEN = "MEU_TOKEN_SECRETO";

export async function POST(request: Request) {
  try {
    // 1. Verify Token
    const token = request.headers.get('x-kirvano-token');
    if (token !== KIRVANO_SECRET_TOKEN) {
      console.warn('Webhook Kirvano: Invalid token received.');
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Parse Request Body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.warn('Webhook Kirvano: Invalid JSON body.', e);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { email, status } = body;

    if (!email || typeof email !== 'string' || !status || typeof status !== 'string') {
      console.warn('Webhook Kirvano: Missing or invalid email/status in body.', body);
      return NextResponse.json({ error: 'Missing or invalid email or status in payload' }, { status: 400 });
    }

    // 3. Find User by Email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim())); // Trim email just in case
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`Webhook Kirvano: User not found with email: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Assuming email is unique, take the first doc.
    const userDocSnap = querySnapshot.docs[0];
    const userDocRef = doc(db, 'users', userDocSnap.id);

    // 4. Determine new plan and update
    // Note: The app uses "premium" for its paid plan, not "pro". Using "premium" for consistency.
    const newPlan = status.toLowerCase() === 'paid' ? 'premium' : 'free';
    const planUpdatedAt = Timestamp.fromDate(new Date());

    const updateData: { plan: string; plan_updated_at: Timestamp; lastPayment?: Timestamp } = {
      plan: newPlan,
      plan_updated_at: planUpdatedAt,
    };

    if (newPlan === 'premium') {
      updateData.lastPayment = planUpdatedAt; // Update lastPayment if plan becomes premium
    }


    const batch = writeBatch(db);
    batch.update(userDocRef, updateData);
    await batch.commit();

    console.log(`Webhook Kirvano: User ${email} plan updated to ${newPlan}. Document ID: ${userDocSnap.id}`);
    return NextResponse.json({ message: 'Plano atualizado com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Kirvano: Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message || String(error) }, { status: 500 });
  }
}
