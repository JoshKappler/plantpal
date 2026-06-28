import type { PlantRepo } from "./PlantRepo";
import { makeLocalRepo } from "./localRepo";
import { demoSeed } from "../demoSeed";
import { DEFAULT_SETTINGS, loadSettings as loadLocalSettings } from "../settingsStore";
import { saveSettings as saveServerSettings } from "../settingsApi";

const MIGRATED_FLAG = "plantpal:migrated";

/**
 * One-time, per-device account bootstrap, run on first login:
 *  - account already has plants → nothing to do.
 *  - else this device has local (IndexedDB) plants → push them up to the account.
 *  - else → seed the starter demo plants so it's never an empty screen.
 *
 * Only ever writes into an empty account, so it can't clobber data already
 * synced from another device.
 */
export async function bootstrapAccount(repo: PlantRepo): Promise<void> {
  const serverPlants = await repo.listPlants();
  if (serverPlants.length > 0) {
    localStorage.setItem(MIGRATED_FLAG, "1");
    return;
  }

  if (!localStorage.getItem(MIGRATED_FLAG)) {
    const local = makeLocalRepo();
    const [localPlants, localEvents] = await Promise.all([
      local.listPlants(),
      local.listEvents(),
    ]);
    if (localPlants.length > 0) {
      for (const p of localPlants) await repo.savePlant(p);
      for (const e of localEvents) await repo.addEvent(e);
      const localSettings = await loadLocalSettings();
      if (JSON.stringify(localSettings) !== JSON.stringify(DEFAULT_SETTINGS)) {
        await saveServerSettings(localSettings);
      }
      localStorage.setItem(MIGRATED_FLAG, "1");
      return;
    }
  }

  localStorage.setItem(MIGRATED_FLAG, "1");
  for (const p of demoSeed(new Date().toISOString())) await repo.savePlant(p);
}
