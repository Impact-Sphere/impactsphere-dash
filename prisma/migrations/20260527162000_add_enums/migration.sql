-- Create missing enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationTier') THEN
        CREATE TYPE "VerificationTier" AS ENUM ('FORMAL_REGISTRATION', 'PARTNER_REFERRAL', 'SOCIAL_MEDIA_VERIFIED', 'PENDING_DOCUMENTS');
    END IF;
END
$$;
