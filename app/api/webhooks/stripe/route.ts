import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/app/lib/db";
import { stripe } from "@/app/lib/stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as {
        id: string;
        metadata: { donationId?: string; projectId?: string };
        amount: number;
      };

      const donationId = paymentIntent.metadata.donationId;
      const projectId = paymentIntent.metadata.projectId;

      if (!donationId || !projectId) {
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        // Mark donation as succeeded
        await tx.donation.update({
          where: { id: donationId },
          data: { status: "SUCCEEDED" },
        });

        // Increment project currentAmount
        await tx.project.update({
          where: { id: projectId },
          data: {
            currentAmount: { increment: paymentIntent.amount / 100 },
          },
        });

        // Check if project is fully funded
        const updatedProject = await tx.project.findUnique({
          where: { id: projectId },
          select: { currentAmount: true, targetBudget: true },
        });

        if (
          updatedProject &&
          updatedProject.currentAmount >= updatedProject.targetBudget
        ) {
          await tx.project.update({
            where: { id: projectId },
            data: { status: "COMPLETED" },
          });
        }
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as {
        id: string;
        metadata: { donationId?: string };
      };

      const donationId = paymentIntent.metadata.donationId;

      if (donationId) {
        await prisma.donation.update({
          where: { id: donationId },
          data: { status: "FAILED" },
        });
      }

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
