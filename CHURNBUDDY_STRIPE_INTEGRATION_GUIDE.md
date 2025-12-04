# ChurnBuddy Backend Integration Guide: Stripe Discount Application

## Current Issue

When a user accepts a discount offer in the ChurnBuddy cancel flow, the discount is **not being applied** to their Stripe subscription. The frontend widget correctly:
- Displays the cancel flow UI
- Shows discount offers
- Records user responses via `/api/cancel-flow`

However, the actual Stripe discount/coupon is never applied to the subscription.

---

## Required Backend Implementation

### 1. Receive Customer & Subscription IDs from Frontend

The embed script should read and forward these data attributes to the backend:

```html
<script
  src="https://churnbuddy.vercel.app/api/embed?flow=FLOW_ID"
  data-churnbuddy
  data-customer-id="cus_xxxxxxxxxxxxx"      <!-- Stripe Customer ID -->
  data-subscription-id="sub_xxxxxxxxxxxxx"  <!-- Stripe Subscription ID -->
  data-discount-percent="50"
  data-discount-duration="6 months"
  data-cancel-selector="[data-cancel-subscription]"
></script>
```

**Backend needs to:**
- Parse these values from the embed initialization
- Store them in the session/flow context
- Pass them when making Stripe API calls

---

### 2. Create/Retrieve Stripe Coupon

When a user accepts the discount offer, the backend must create or retrieve a Stripe coupon:

```javascript
// Node.js / Stripe SDK example
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function getOrCreateCoupon(discountPercent, durationMonths) {
  const couponId = `churnbuddy_${discountPercent}off_${durationMonths}mo`;
  
  try {
    // Try to retrieve existing coupon
    return await stripe.coupons.retrieve(couponId);
  } catch (error) {
    // Create new coupon if doesn't exist
    return await stripe.coupons.create({
      id: couponId,
      percent_off: discountPercent,
      duration: 'repeating',
      duration_in_months: durationMonths,
      name: `ChurnBuddy ${discountPercent}% Off for ${durationMonths} Months`
    });
  }
}
```

---

### 3. Apply Coupon to Subscription

After user accepts the offer, apply the coupon to their Stripe subscription:

```javascript
async function applyDiscountToSubscription(subscriptionId, couponId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: couponId
    });
    
    return {
      success: true,
      subscription: subscription,
      message: `Applied ${couponId} to subscription ${subscriptionId}`
    };
  } catch (error) {
    console.error('Failed to apply discount:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

### 4. API Endpoint for Discount Application

Create an API endpoint that the cancel flow calls when user accepts an offer:

```javascript
// POST /api/apply-discount
app.post('/api/apply-discount', async (req, res) => {
  const { 
    flowId,
    customerId,       // Stripe customer ID (cus_xxx)
    subscriptionId,   // Stripe subscription ID (sub_xxx)
    discountPercent,  // e.g., 50
    discountDuration, // e.g., "6 months" -> parse to 6
    userEmail,
    reason            // Why user was cancelling
  } = req.body;

  // Validate required fields
  if (!subscriptionId || !discountPercent) {
    return res.status(400).json({ 
      error: 'Missing required fields: subscriptionId, discountPercent' 
    });
  }

  // Parse duration (e.g., "6 months" -> 6)
  const durationMonths = parseInt(discountDuration) || 3;

  try {
    // 1. Get or create coupon
    const coupon = await getOrCreateCoupon(discountPercent, durationMonths);
    
    // 2. Apply to subscription
    const result = await applyDiscountToSubscription(subscriptionId, coupon.id);
    
    if (result.success) {
      // 3. Log the save event
      await logChurnbuddySave({
        flowId,
        customerId,
        subscriptionId,
        couponApplied: coupon.id,
        discountPercent,
        durationMonths,
        userEmail,
        reason,
        savedAt: new Date()
      });

      return res.json({
        success: true,
        message: 'Discount applied successfully',
        couponId: coupon.id,
        newSubscriptionStatus: result.subscription.status
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Apply discount error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

### 5. Update Embed Script to Call Backend

The frontend embed script needs to call the backend when user accepts an offer:

```javascript
// Inside ChurnBuddy embed script
async function handleOfferAccepted(offerData) {
  const config = getEmbedConfig(); // Get data attributes
  
  try {
    const response = await fetch('https://churnbuddy.vercel.app/api/apply-discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowId: config.flowId,
        customerId: config.customerId,       // from data-customer-id
        subscriptionId: config.subscriptionId, // from data-subscription-id
        discountPercent: config.discountPercent,
        discountDuration: config.discountDuration,
        userEmail: config.customerEmail,
        reason: offerData.cancellationReason
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Trigger onSaved callback
      if (typeof window.ChurnBuddyCallbacks?.onSaved === 'function') {
        window.ChurnBuddyCallbacks.onSaved(result);
      }
      showSuccessMessage('Your discount has been applied!');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('ChurnBuddy: Failed to apply discount', error);
    showErrorMessage('Failed to apply discount. Please contact support.');
  }
}
```

---

### 6. Trigger JavaScript Callbacks

Ensure the `onSaved` and `onCancel` callbacks passed via `ChurnBuddy.init()` are actually triggered:

```javascript
// Store callbacks during init
let savedCallbacks = {};

window.ChurnBuddy = {
  init: function(config) {
    savedCallbacks = {
      onSaved: config.onSaved,
      onCancel: config.onCancel
    };
    // ... rest of init
  }
};

// Call them when appropriate
function triggerOnSaved(data) {
  if (typeof savedCallbacks.onSaved === 'function') {
    savedCallbacks.onSaved(data);
  }
}

function triggerOnCancel(data) {
  if (typeof savedCallbacks.onCancel === 'function') {
    savedCallbacks.onCancel(data);
  }
}
```

---

## Environment Variables Required

The ChurnBuddy backend needs:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx   # or sk_test_xxxxx for testing

# Database (for logging)
DATABASE_URL=postgres://...
```

---

## Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Customer      │     │   ChurnBuddy     │     │     Stripe      │
│   Website       │     │   Backend        │     │     API         │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │ 1. Click Cancel       │                        │
         │ ─────────────────────>│                        │
         │                       │                        │
         │ 2. Show Cancel Flow   │                        │
         │ <─────────────────────│                        │
         │                       │                        │
         │ 3. Accept Discount    │                        │
         │ ─────────────────────>│                        │
         │                       │                        │
         │                       │ 4. Create/Get Coupon   │
         │                       │ ───────────────────────>
         │                       │                        │
         │                       │ 5. Apply to Sub        │
         │                       │ ───────────────────────>
         │                       │                        │
         │                       │ 6. Success Response    │
         │                       │ <───────────────────────
         │                       │                        │
         │ 7. Trigger onSaved()  │                        │
         │ <─────────────────────│                        │
         │                       │                        │
         │ 8. Show Success       │                        │
         │ <─────────────────────│                        │
         │                       │                        │
```

---

## Testing Checklist

- [ ] Embed script reads `data-customer-id` and `data-subscription-id`
- [ ] Backend `/api/apply-discount` endpoint exists and works
- [ ] Stripe coupon is created correctly
- [ ] Coupon is applied to the subscription
- [ ] `onSaved` callback is triggered with result data
- [ ] `onCancel` callback is triggered when user declines
- [ ] Error handling shows user-friendly messages
- [ ] All actions are logged for analytics

---

## Example Test Request

```bash
curl -X POST https://churnbuddy.vercel.app/api/apply-discount \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "503157dc-608f-474a-a151-c4fdb9485337",
    "customerId": "cus_ABC123",
    "subscriptionId": "sub_XYZ789",
    "discountPercent": 50,
    "discountDuration": "6 months",
    "userEmail": "customer@example.com",
    "reason": "Too expensive"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Discount applied successfully",
  "couponId": "churnbuddy_50off_6mo",
  "newSubscriptionStatus": "active"
}
```

