import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('action, details, created_at')
      .eq('action', 'sms_sent')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalSent = logs?.length || 0;
    const successful = logs?.filter(log => 
      log.details && JSON.parse(log.details).status === 'success'
    ).length || 0;
    const failed = totalSent - successful;

    const lastSent = logs && logs.length > 0 ? logs[0].created_at : null;

    const provider = process.env.NEXT_PUBLIC_SMS_PROVIDER || 'MOCK';
    const monthlyLimit = parseInt(process.env.SMS_MONTHLY_LIMIT || '100');

    return NextResponse.json({
      provider: provider.toUpperCase(),
      totalSent,
      successful,
      failed,
      monthlyLimit,
      lastSent,
      percentage: Math.round((totalSent / monthlyLimit) * 100),
      remaining: monthlyLimit - totalSent
    });

  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS stats' },
      { status: 500 }
    );
  }
}
