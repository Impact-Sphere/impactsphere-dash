import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ImpactSphere",
  description: "ImpactSphere Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-on-surface">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 6, 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              1. Introduction
            </h2>
            <p>
              ImpactSphere (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, store, share, and safeguard your
              personal information when you use the ImpactSphere platform and
              related services (collectively, the &quot;Services&quot;). By
              using our Services, you consent to the practices described in this
              policy.
            </p>
            <p>
              This policy is designed to comply with the General Data Protection
              Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              2. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly, information
              generated through your use of the Services, and information from
              third parties.
            </p>
            <h3 className="font-medium text-on-surface">
              2.1 Account and Profile Information
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and email address</li>
              <li>Password (stored as a cryptographic hash)</li>
              <li>Organization type (NGO or Company)</li>
              <li>
                Organization name, registration number, tax ID, and address
              </li>
              <li>
                Mission statement, activities description, and impact areas
              </li>
              <li>Representative name, role, and identification details</li>
              <li>Biography or provider descriptions (for service listings)</li>
            </ul>

            <h3 className="font-medium text-on-surface">
              2.2 Verification Documents
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registration certificates and statutory documents</li>
              <li>Proof of activity reports and partner letters</li>
              <li>
                Representative identification documents (passport, national ID)
              </li>
              <li>Tax identification documentation</li>
            </ul>

            <h3 className="font-medium text-on-surface">
              2.3 Payment Information
            </h3>
            <p>
              We do not store full payment card details. Donations and service
              payments are processed by Stripe. We receive transaction records
              including payment status, amount, date, and a pseudonymous payment
              intent identifier from Stripe.
            </p>

            <h3 className="font-medium text-on-surface">2.4 Usage Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address, browser type, and device information</li>
              <li>
                Pages visited, features used, and time spent on the platform
              </li>
              <li>Session tokens and authentication logs</li>
              <li>Search queries and filter preferences</li>
            </ul>

            <h3 className="font-medium text-on-surface">2.5 Communications</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Support chat messages and email correspondence</li>
              <li>Meeting requests and scheduling data</li>
              <li>Project comments and service review submissions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              3. How We Use Your Information
            </h2>
            <p>We process your personal data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Providing Services:</strong> To create and manage your
                account, verify your organization, list projects and services,
                process donations, and enable communication between users.
              </li>
              <li>
                <strong>Matching and Recommendations:</strong> To suggest
                relevant projects, NGOs, or Companies based on location, impact
                areas, budget, and stated preferences.
              </li>
              <li>
                <strong>Security and Fraud Prevention:</strong> To authenticate
                users, detect suspicious activity, enforce our Terms of Service,
                and protect the integrity of the platform.
              </li>
              <li>
                <strong>Customer Support:</strong> To respond to inquiries,
                resolve disputes, and improve our support quality.
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws, regulations, legal processes, or enforceable governmental
                requests.
              </li>
              <li>
                <strong>Platform Improvement:</strong> To analyze usage trends,
                diagnose technical issues, and develop new features. Where
                possible, we use aggregated or pseudonymized data for analytics.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              4. Legal Basis for Processing (GDPR)
            </h2>
            <p>
              We process personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Contractual necessity:</strong> To perform our contract
                with you (e.g., account creation, transaction processing,
                service delivery).
              </li>
              <li>
                <strong>Consent:</strong> Where required, such as for accepting
                these Terms and Privacy Policy, or for optional marketing
                communications. You may withdraw consent at any time.
              </li>
              <li>
                <strong>Legitimate interests:</strong> For security, fraud
                prevention, platform analytics, and improving user experience,
                balanced against your rights.
              </li>
              <li>
                <strong>Legal obligation:</strong> To comply with tax,
                accounting, and regulatory requirements.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              5. How We Share Your Information
            </h2>
            <p>
              We do not sell your personal information. We may share data in the
              following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Between Platform Users:</strong> When you list a
                project, service, or matching request, certain profile
                information (organization name, description, location, impact
                areas) is visible to other verified users to facilitate
                collaboration.
              </li>
              <li>
                <strong>Service Providers:</strong> We use trusted third parties
                for hosting, payment processing (Stripe), email delivery
                (Resend), and analytics. These providers process data only on
                our behalf and under strict confidentiality obligations.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information
                if required by law, subpoena, or governmental authority, or to
                protect our rights, property, or safety, or that of our users or
                the public.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets, user information may be
                transferred as part of the transaction, subject to the same
                privacy commitments.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              6. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide you with Services. We may retain
              certain information for longer periods where necessary for legal,
              tax, accounting, fraud prevention, or security purposes.
              Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Account data: retained until account deletion, plus up to 2
                years for legal compliance.
              </li>
              <li>
                Transaction records: retained for 7 years to comply with tax and
                accounting obligations.
              </li>
              <li>
                Verification documents: retained for the duration of your
                account plus 1 year after termination.
              </li>
              <li>
                Support chat logs: retained for 2 years for quality assurance
                and dispute resolution.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              7. Security Measures
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your data, including encryption in transit (TLS), password
              hashing, access controls, and regular security reviews. However,
              no method of transmission or storage is 100% secure. You are
              responsible for maintaining the confidentiality of your account
              credentials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              8. Your Rights
            </h2>
            <p>
              Under the GDPR and applicable laws, you have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Rectification:</strong> Request correction of inaccurate
                or incomplete data.
              </li>
              <li>
                <strong>Erasure (&quot;Right to be Forgotten&quot;):</strong>{" "}
                Request deletion of your personal data, subject to legal
                retention requirements.
              </li>
              <li>
                <strong>Restriction:</strong> Request that we limit processing
                of your data in certain circumstances.
              </li>
              <li>
                <strong>Data Portability:</strong> Request a machine-readable
                copy of your data to transfer to another service.
              </li>
              <li>
                <strong>Objection:</strong> Object to processing based on
                legitimate interests or for direct marketing.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent at any time
                where processing is based on consent, without affecting the
                lawfulness of processing before withdrawal.
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:impactsphere2026@gmail.com"
                className="text-primary hover:underline"
              >
                impactsphere2026@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              9. Cookies and Similar Technologies
            </h2>
            <p>
              We use cookies and similar technologies to maintain your session,
              remember preferences, and analyze platform usage. Session cookies
              are essential for authentication and security. You can manage
              cookie preferences through your browser settings. Disabling
              essential cookies may impair platform functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              10. International Data Transfers
            </h2>
            <p>
              Our servers and some service providers may be located outside your
              country of residence, including within the European Economic Area
              (EEA) and the United States. When we transfer data
              internationally, we ensure appropriate safeguards are in place,
              such as Standard Contractual Clauses approved by the European
              Commission, to protect your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              11. Children&apos;s Privacy
            </h2>
            <p>
              ImpactSphere is not intended for individuals under the age of 18.
              We do not knowingly collect personal information from children. If
              you believe we have inadvertently collected data from a minor,
              please contact us immediately and we will delete the information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy to reflect changes in our
              practices or for legal reasons. Material changes will be
              communicated via email or a prominent notice on the platform at
              least 15 days before taking effect. We encourage you to review
              this policy periodically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              13. Contact and Data Protection Officer
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <p className="pl-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:impactsphere2026@gmail.com"
                className="text-primary hover:underline"
              >
                impactsphere2026@gmail.com
              </a>
              <br />
              <strong>Address:</strong> ImpactSphere, Lisbon, Portugal
            </p>
            <p>
              If you are based in the European Union and believe we have
              violated your data protection rights, you also have the right to
              lodge a complaint with your local supervisory authority.
            </p>
          </section>
        </div>

        <div className="text-center text-sm text-gray-500">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
