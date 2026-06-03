import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend";
import { prisma } from "./db";

let resendInstance: Resend | undefined;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token: _token }, _request) => {
      // console.debug(`If email slow or not working: ${url}`);
      const email_from = process.env.EMAIL_FROM;
      if (email_from) {
        getResend().emails.send({
          from: email_from,
          to: user.email,
          subject: "Reset your password",
          text: `Click the link to reset your password: ${url}`,
        });
      }
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  socialProviders: {},
});
