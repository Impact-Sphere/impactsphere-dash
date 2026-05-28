import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({user, url, token}, request) => {
      // console.debug(`If email slow or not working: ${url}`);
      resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      })
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  socialProviders: {},
});
