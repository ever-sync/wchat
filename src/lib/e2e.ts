/** Ativo quando o app é servido com `VITE_E2E_MOCK_AUTH=true` (Playwright / CI). */
export const isE2eMockAuth = import.meta.env.VITE_E2E_MOCK_AUTH === "true";

export const E2E_MOCK_PROFILE_ID = "00000000-0000-4000-8000-000000000099";
