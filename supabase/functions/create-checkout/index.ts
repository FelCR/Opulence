import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      whatsapp,
      schedule,
      experience,
      tickets,
      attendees,
      total_amount,
      unit_price,
      event_id,
    } = body;

    // Construir la URL base a partir del Referer o una variable de entorno
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const siteUrl = Deno.env.get('SITE_URL') || new URL(referer).origin || 'https://opulencemexico.com';
    const successUrl = `${siteUrl}/eventos.html?pago=exitoso`;
    const cancelUrl  = `${siteUrl}/eventos.html#registro`;

    // 1. Crear la sesión de Stripe primero para obtener el session ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `Evento Opulence – ${schedule || 'Registro'}`,
          },
          unit_amount: Math.round(unit_price * 100),
        },
        quantity: tickets,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        name,
        whatsapp,
        schedule: schedule || '',
        experience: experience || '',
        attendees: JSON.stringify(attendees || []),
        event_id: event_id ? String(event_id) : '',
      },
    });

    // 2. Guardar el registro en Supabase con estado 'Pendiente'
    const registrationPayload: Record<string, unknown> = {
      name,
      email,
      whatsapp,
      schedule,
      experience,
      tickets,
      attendees: attendees || [],
      total_amount,
      status: 'Pendiente',
      stripe_session_id: session.id,
    };
    if (event_id) registrationPayload.event_id = event_id;

    const { error: dbError } = await supabase
      .from('event_registrations')
      .insert(registrationPayload);

    if (dbError) {
      // Loguear el error pero no bloquear el pago — el webhook puede recuperar el registro
      console.error('Error al guardar registro en Supabase:', dbError.message);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en create-checkout:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
