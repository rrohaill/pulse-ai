import { db } from "../src/lib/db";
import { sources } from "../src/lib/db/schema";
import { DEFAULT_SOURCES } from "../src/lib/constants";
import { generateId, now } from "../src/lib/utils";

async function seed() {
  console.log("Seeding default sources...");

  for (const source of DEFAULT_SOURCES) {
    try {
      await db.insert(sources).values({
        id: generateId(),
        name: source.name,
        type: source.type,
        category: source.category,
        url: source.url,
        enabled: 1,
        fetchIntervalMinutes: 60,
        createdAt: now(),
      });
      console.log(`  + ${source.name}`);
    } catch (err) {
      // Skip duplicates
      console.log(`  ~ ${source.name} (already exists)`);
    }
  }

  console.log("Done!");
}

seed();
