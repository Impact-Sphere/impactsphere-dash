import Stripe from "stripe";

let stripeInstance: Stripe | undefined;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeInstance;
}
