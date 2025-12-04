import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    // Fetch the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed')
    }

    // Get Supabase client with service role key for database writes
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Extract IDs
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    const userId = session.client_reference_id
    const priceId = session.metadata?.price_id
    const planName = session.metadata?.plan_name
    const email = session.customer_email

    if (!userId) {
      throw new Error('User ID not found in session')
    }

    // Upsert subscription in database
    const { data, error } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userId,
        email: email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        price_id: priceId,
        plan_name: planName,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: data,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

