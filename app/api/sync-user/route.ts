import { NextResponse } from 'next/server';
import { checkUser } from '@/lib/checkUser';

export async function POST() {
  try {
    // This will create the user in the database if they don't exist
    const user = await checkUser();
    
    if (user) {
      return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
    } else {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync user' }, { status: 500 });
  }
}
