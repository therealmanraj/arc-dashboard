import * as migration_20261124_233410_initial from './20261124_233410_initial';
import * as migration_20261124_233418_seed_pick_lists from './20261124_233418_seed_pick_lists';
import * as migration_20261124_233858_grants from './20261124_233858_grants';
import * as migration_20261124_234820_display_settings from './20261124_234820_display_settings';

export const migrations = [
  {
    up: migration_20261124_233410_initial.up,
    down: migration_20261124_233410_initial.down,
    name: '20261124_233410_initial',
  },
  {
    up: migration_20261124_233418_seed_pick_lists.up,
    down: migration_20261124_233418_seed_pick_lists.down,
    name: '20261124_233418_seed_pick_lists',
  },
  {
    up: migration_20261124_233858_grants.up,
    down: migration_20261124_233858_grants.down,
    name: '20261124_233858_grants',
  },
  {
    up: migration_20261124_234820_display_settings.up,
    down: migration_20261124_234820_display_settings.down,
    name: '20261124_234820_display_settings'
  },
];
