import { test, expect, resetDatabase } from "../fixtures";

test("login via API → reset → login again still works", async ({
  page,
  loginAs,
}) => {
  await loginAs("coach");
  const tokenBefore = await page.evaluate(() => localStorage.getItem("token"));
  expect(tokenBefore).toBeTruthy();
  expect(
    await page.evaluate(() => localStorage.getItem("userRole")),
  ).toBe("COACH");

  await resetDatabase();

  await loginAs("coach");
  const tokenAfter = await page.evaluate(() => localStorage.getItem("token"));
  expect(tokenAfter).toBeTruthy();
  expect(
    await page.evaluate(() => localStorage.getItem("username")),
  ).toBe("e2e_coach");
});
