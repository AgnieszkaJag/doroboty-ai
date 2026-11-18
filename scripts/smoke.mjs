import assert from "node:assert/strict";

const target = new URL(process.argv[2] ?? "");
assert.ok(
  target.protocol === "https:" ||
    (target.protocol === "http:" && ["127.0.0.1", "localhost"].includes(target.hostname)),
  "Use HTTPS, or a local preview URL.",
);
assert.ok(!target.username && !target.password, "Do not put credentials in the URL.");
target.hash = "";
target.search = "";

async function request(url, html = false) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "error" });
      assert.equal(response.status, 200, `Unexpected HTTP status for ${url.pathname}`);
      if (html) {
        assert.match(response.headers.get("content-type") ?? "", /text\/html/);
        return await response.text();
      }
      assert.doesNotMatch(response.headers.get("content-type") ?? "", /text\/html/);
      await response.arrayBuffer();
      return "";
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

const html = await request(target, true);
const assets = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(
  (match) => new URL(match[1], target),
);
assert.ok(
  assets.some((url) => url.pathname.endsWith(".js")),
  "No application JavaScript found.",
);
assert.ok(assets.length <= 20, "Unexpected entry-asset count.");
for (const asset of assets) {
  assert.equal(asset.origin, target.origin, "Runtime entry assets must be local.");
  await request(asset);
}
for (const filename of ["anna-kowalska-cv-v1.pdf", "marek-nowak-cv-v1.pdf"]) {
  const url = new URL(`/cv/${filename}`, target);
  await request(url);
}
console.log(
  `Static smoke passed for ${target.origin}: HTML, ${assets.length} entry assets and 2 CVs.`,
);
console.log(
  "This does not verify browser journeys, PostHog delivery, alerts or external-user outcomes.",
);
