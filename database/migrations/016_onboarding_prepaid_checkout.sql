-- Pago Stripe antes del registro (post-plan): sesión verificada y consumida al crear empresa.
CREATE TABLE IF NOT EXISTS onboarding_prepaid_checkout (
    id                  BIGSERIAL PRIMARY KEY,
    stripe_session_id   VARCHAR(255)   NOT NULL UNIQUE,
    plan_codigo         VARCHAR(64)    NOT NULL,
    paid_at             TIMESTAMPTZ    NOT NULL,
    consumed_at         TIMESTAMPTZ    NULL,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_prepaid_unconsumed
    ON onboarding_prepaid_checkout (plan_codigo)
    WHERE consumed_at IS NULL;
