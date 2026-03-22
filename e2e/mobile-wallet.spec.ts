import { test, expect } from "@playwright/test";

/**
 * Comprueba que la app carga correctamente en viewport tipo iPhone (misma clase de dispositivo
 * donde usarías Albedo). El login con Supabase sigue siendo manual o con credenciales de prueba.
 */
test.describe("app en móvil (viewport iPhone)", () => {
  test("página de login visible y usable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /inicia sesión/i })).toBeVisible();
    await expect(page.getByPlaceholder("Correo electrónico")).toBeVisible();
  });
});
