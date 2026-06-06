import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ImpactSphere",
  description: "ImpactSphere Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-on-surface">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500">Last updated: June 6, 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              1. Introduction and Acceptance
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of the ImpactSphere platform, website, and services
              (collectively, the &quot;Services&quot;). ImpactSphere
              (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a
              digital marketplace that connects non-governmental organizations
              (&quot;NGOs&quot;) with companies and corporate donors
              (&quot;Companies&quot;) to facilitate social impact projects,
              donations, and professional services.
            </p>
            <p>
              By creating an account, accessing, or using our Services, you
              agree to be bound by these Terms and our Privacy Policy. If you do
              not agree, you must not use the Services. We may update these
              Terms from time to time, and continued use constitutes acceptance
              of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              2. Eligibility
            </h2>
            <p>
              You must be at least 18 years old and have the legal authority to
              enter into these Terms. Organizations registering as NGOs must be
              legally recognized non-profit or non-governmental entities in
              their jurisdiction. Companies must be duly incorporated
              businesses. By registering, you represent and warrant that all
              information you provide is accurate, complete, and current, and
              that you are authorized to act on behalf of your organization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              3. Account Registration and Security
            </h2>
            <p>
              To access most features, you must register for an account. You are
              responsible for maintaining the confidentiality of your password
              and for all activities that occur under your account. You agree to
              notify us immediately of any unauthorized use. We reserve the
              right to suspend or terminate accounts that violate these Terms or
              that we suspect are being used fraudulently.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              4. Verification Process
            </h2>
            <p>
              ImpactSphere verifies the identity and legal status of registered
              organizations. NGOs and Companies must submit accurate
              registration documents, representative identification, and other
              materials as requested. We reserve the right to approve, reject,
              or request additional information at any stage of verification.
              Approval does not constitute an endorsement by ImpactSphere, and
              we do not guarantee the legitimacy, financial health, or
              operational capacity of any user.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              5. Platform Services
            </h2>
            <p>ImpactSphere provides the following core services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Project Listings:</strong> NGOs may publish project
                proposals seeking funding or partnerships.
              </li>
              <li>
                <strong>Donations:</strong> Companies may make financial
                contributions to NGO projects through our integrated payment
                processor.
              </li>
              <li>
                <strong>Service Marketplace:</strong> Verified providers may
                list professional services (e.g., communications, event
                management, design) that NGOs or Companies may acquire.
              </li>
              <li>
                <strong>Matching:</strong> We may algorithmically or manually
                suggest projects or NGOs to Companies based on stated
                preferences, location, and impact areas.
              </li>
              <li>
                <strong>Communication Tools:</strong> In-platform messaging,
                meeting scheduling, and support chat to facilitate
                collaboration.
              </li>
            </ul>
            <p>
              We do not guarantee that any project will receive funding, that
              any Company will find a suitable partner, or that any service will
              be delivered to satisfaction. We act as a facilitator, not a party
              to any agreement between users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              6. Payments and Fees
            </h2>
            <p>
              Donations and service payments are processed through Stripe. By
              making a payment, you agree to Stripe&apos;s terms and conditions
              in addition to ours. ImpactSphere may charge platform fees, which
              will be clearly disclosed before any transaction is confirmed. All
              fees are non-refundable unless otherwise stated or required by
              law.
            </p>
            <p>
              For service transactions, funds may be held in escrow or released
              according to milestones defined at the point of acquisition.
              Disputes over service delivery should first be attempted to be
              resolved between the parties; ImpactSphere may mediate but is not
              liable for unresolved disputes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              7. User Content and Conduct
            </h2>
            <p>
              You retain ownership of any content you upload, including project
              descriptions, images, documents, and service listings. By
              uploading content, you grant ImpactSphere a non-exclusive,
              royalty-free, worldwide license to use, display, and distribute
              that content solely for the purpose of operating and promoting the
              platform.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Upload false, misleading, or fraudulent information or
                documents;
              </li>
              <li>
                Use the platform for illegal activities, harassment, hate
                speech, or discrimination;
              </li>
              <li>
                Attempt to circumvent verification, security, or payment
                systems;
              </li>
              <li>
                Scrape, crawl, or use automated means to access the platform
                without permission;
              </li>
              <li>Impersonate another person or organization;</li>
              <li>Upload malware, viruses, or other harmful code.</li>
            </ul>
            <p>
              We reserve the right to remove content and suspend accounts that
              violate these rules.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              8. Intellectual Property
            </h2>
            <p>
              The ImpactSphere name, logo, software, and all related designs,
              text, graphics, and code are our property or licensed to us and
              are protected by copyright, trademark, and other intellectual
              property laws. You may not use our trademarks or branding without
              prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              9. Third-Party Links and Services
            </h2>
            <p>
              The platform may contain links to third-party websites or services
              (e.g., Stripe, external project sites). We are not responsible for
              the content, privacy practices, or terms of those third parties.
              Your interactions with third-party providers are solely between
              you and them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              10. Termination
            </h2>
            <p>
              You may delete your account at any time by contacting support. We
              may suspend or terminate your account immediately, without notice,
              for conduct that we believe violates these Terms or is harmful to
              other users, us, or third parties. Upon termination, your right to
              use the Services ceases immediately, but provisions regarding
              intellectual property, liability, and governing law shall survive.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              11. Disclaimers
            </h2>
            <p>
              THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICES WILL BE
              UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT ANY DEFECTS WILL BE
              CORRECTED. WE DO NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY
              FOR ANY PROJECT, DONATION, OR SERVICE LISTED ON THE PLATFORM.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              12. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IMPACTSPHERE AND ITS
              OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING LOST PROFITS, DATA LOSS, OR REPUTATIONAL HARM, ARISING
              OUT OF OR RELATED TO YOUR USE OF THE SERVICES, EVEN IF ADVISED OF
              THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT
              EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR
              TO THE CLAIM, OR EUR 100, WHICHEVER IS GREATER.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              13. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of Portugal, without regard to its conflict of law
              principles. Any dispute arising out of or relating to these Terms
              or the Services shall first be attempted to be resolved through
              good-faith negotiation. If unresolved, disputes shall be submitted
              to the exclusive jurisdiction of the courts of Lisbon, Portugal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              14. Changes to Terms
            </h2>
            <p>
              We may modify these Terms at any time. Material changes will be
              notified via email or a prominent notice on the platform at least
              15 days before taking effect. Your continued use after the
              effective date constitutes acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-on-surface">
              15. Contact
            </h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:impactsphere2026@gmail.com"
                className="text-primary hover:underline"
              >
                impactsphere2026@gmail.com
              </a>
              .
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
