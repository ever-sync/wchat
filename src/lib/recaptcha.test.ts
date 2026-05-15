import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getRecaptchaSiteKey, isRecaptchaEnabled, RECAPTCHA_TEST_SITE_KEY } from "./recaptcha";

describe("recaptcha", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa chave de teste em desenvolvimento quando nao configurada", () => {
    expect(getRecaptchaSiteKey()).toBe(RECAPTCHA_TEST_SITE_KEY);
    expect(isRecaptchaEnabled()).toBe(true);
  });

  it("usa chave configurada quando definida", () => {
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "minha-chave");
    expect(getRecaptchaSiteKey()).toBe("minha-chave");
  });
});
