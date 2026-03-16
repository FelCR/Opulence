import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Actualizar el registro existente a 'Confirmado' usando el stripe_session_id
    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({ status: 'Confirmado' })
      .eq('stripe_session_id', session.id);

    if (updateError) {
      console.error('Error al actualizar registro:', updateError.message);

      // Si no existía el registro (raro, pero puede pasar), crearlo ahora
      if (updateError.code === 'PGRST116' || updateError.message.includes('0 rows')) {
        const meta = session.metadata || {};
        const fallbackPayload: Record<string, unknown> = {
          name: meta.name || session.customer_details?.name || '',
          email: session.customer_email || session.customer_details?.email || '',
          whatsapp: meta.whatsapp || '',
          schedule: meta.schedule || '',
          experience: meta.experience || '',
          tickets: 1,
          attendees: meta.attendees ? JSON.parse(meta.attendees) : [],
          total_amount: session.amount_total ? session.amount_total / 100 : 0,
          status: 'Confirmado',
          stripe_session_id: session.id,
        };
        if (meta.event_id) fallbackPayload.event_id = parseInt(meta.event_id);

        const { error: insertError } = await supabase
          .from('event_registrations')
          .insert(fallbackPayload);

        if (insertError) {
          console.error('Error al crear registro de respaldo:', insertError.message);
        } else {
          console.log(`Registro de respaldo creado para sesión: ${session.id}`);
        }
      }
    } else {
      console.log(`Registro confirmado para sesión: ${session.id}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
