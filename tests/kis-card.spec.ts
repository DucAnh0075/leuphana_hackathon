import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import dataset from "../lib/demo-patients.json";

test("KIS-Karten-SQL enthält Formulare und Fakten und bleibt synchron", () => {
  // Import the ESM script in native Node; this suite is transformed to CommonJS.
  const sql = execFileSync(process.execPath, ["--input-type=module", "-e", 'import { buildKisCardSql } from "./scripts/build_kis_card_sql.mjs"; process.stdout.write(buildKisCardSql());'], { encoding: "utf8" });
  for (const value of ["Vorsorgevollmacht.pdf", "Patientenverfuegung.pdf", "kis_card_scans", ...dataset.patients[1].facts.map(fact => fact.id)]) expect(sql).toContain(value);
  expect(readFileSync("supabase/kis-card.sql", "utf8")).toBe(sql);
});
test("Karten-API meldet fehlende Supabase-Konfiguration", async ({ request }) => {
  test.skip(!!process.env.NEXT_PUBLIC_SUPABASE_URL, "Supabase ist konfiguriert");
  const response = await request.get("/api/karte?card=demo");
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false });
  expect(response.headers()["access-control-allow-origin"]).toBe("*");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("Karten-API unterstützt CORS und lehnt ungültige Kennungen ab", async ({ request }) => {
  const options = await request.fetch("/api/karte", { method: "OPTIONS" });
  expect(options.status()).toBe(204);
  expect(options.headers()["access-control-allow-methods"]).toBe("GET, POST, OPTIONS");
  for (const card of ["x".repeat(65), 42]) {
    const response = await request.post("/api/karte", { data: { card } });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false });
  }
});

test("Unbekannte KIS-Karte erhält die aktuelle Akte", async ({ page }) => {
  await page.goto("/?patient=26004182");
  await expect(page.getByLabel("Patientenkontext")).toContainText("Berger, Erika");
  await page.getByRole("tab", { name: /Dokumente/ }).click();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("kis-card-scan", { detail: "unbekannt" })));
  await expect(page.getByRole("status").filter({ hasText: "Unbekannte Karte" })).toContainText("Unbekannte Karte „unbekannt“");
  await expect(page.getByLabel("Patientenkontext")).toContainText("Berger, Erika");
  await page.getByRole("button", { name: "Benachrichtigung schließen" }).click();
  await expect(page.locator(".scan-toast")).toHaveCount(0);
});
