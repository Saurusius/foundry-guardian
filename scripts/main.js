const MODULE_ID = "foundry-guardian";

const DEFAULT_PROTECTIONS = Object.freeze({
  settings: true,
  modules: true,
  users: true,
  world: true,
  setup: true
});

const ACTION_PROTECTION_MAP = Object.freeze({
  configure: "settings",
  settings: "settings",
  modules: "modules",
  manageModules: "modules",
  players: "users",
  users: "users",
  permissions: "users",
  world: "world",
  configureWorld: "world",
  setup: "setup",
  returnToSetup: "setup"
});

const PROTECTED_APPLICATIONS = Object.freeze({
  SettingsConfig: "settings",
  ModuleManagement: "modules",
  ModuleManagementForm: "modules",
  UserManagement: "users",
  PermissionConfig: "users",
  WorldConfig: "world",
  WorldConfiguration: "world"
});

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`${MODULE_ID} | Unable to parse setting`, error);
    return fallback;
  }
}

function localizeOr(key, fallback) {
  return game.i18n?.has?.(key) ? game.i18n.localize(key) : fallback;
}

function getAdminIds() {
  const raw = game.settings.get(MODULE_ID, "adminIds");
  const ids = safeParse(raw, []);
  return Array.isArray(ids) ? ids : [];
}

function getProtections() {
  const raw = game.settings.get(MODULE_ID, "protections");
  const parsed = safeParse(raw, {});
  return { ...DEFAULT_PROTECTIONS, ...(parsed ?? {}) };
}

function isAuthorized(user = game.user) {
  if (!user?.isGM) return false;

  const adminIds = getAdminIds();
  // Anti-lockout: before the first explicit configuration, every GM may initialize Guardian.
  if (adminIds.length === 0) return true;

  return adminIds.includes(user.id);
}

function isProtected(key) {
  return Boolean(getProtections()[key]);
}

function notifyDenied() {
  ui.notifications?.warn(localizeOr("FG.Denied", "Foundry Guardian : cet accès est réservé aux administrateurs autorisés."));
}

function settingsRootFor(element) {
  if (!(element instanceof Element)) return null;
  return element.closest(
    '#settings, .settings-sidebar, [data-tab="settings"], [data-tab="configure"], .tab[data-tab="settings"]'
  );
}

function removeProtectedSettingsControls(root = document) {
  if (isAuthorized()) {
    document.body.classList.remove("foundry-guardian-restricted");
    return;
  }

  document.body.classList.add("foundry-guardian-restricted");

  const selectors = [];
  for (const [action, protection] of Object.entries(ACTION_PROTECTION_MAP)) {
    if (isProtected(protection)) selectors.push(`[data-action="${action}"]`);
  }

  if (!selectors.length) return;

  for (const node of root.querySelectorAll?.(selectors.join(",")) ?? []) {
    if (settingsRootFor(node)) node.setAttribute("data-fg-protected", "true");
  }
}

function captureProtectedClicks(event) {
  if (isAuthorized()) return;
  if (!(event.target instanceof Element)) return;

  const control = event.target.closest("[data-action]");
  if (!control || !settingsRootFor(control)) return;

  const action = control.dataset.action;
  const protection = ACTION_PROTECTION_MAP[action];
  if (!protection || !isProtected(protection)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  notifyDenied();
}

function getApplicationProtection(app) {
  const name = app?.constructor?.name;
  if (name && PROTECTED_APPLICATIONS[name]) return PROTECTED_APPLICATIONS[name];

  // SettingsConfig is part of the public v14 API, so prefer an instanceof check when available.
  const SettingsConfig = foundry?.applications?.settings?.SettingsConfig;
  if (SettingsConfig && app instanceof SettingsConfig) return "settings";

  return null;
}

class GuardianConfig extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "foundry-guardian-config",
    classes: ["foundry-guardian"],
    tag: "form",
    position: {
      width: 610,
      height: "auto"
    },
    window: {
      title: "Foundry Guardian — Gestion des accès",
      icon: "fa-solid fa-shield-halved",
      resizable: true
    },
    form: {
      closeOnSubmit: true,
      handler: GuardianConfig.#onSubmit
    }
  };

  static PARTS = {
    form: {
      template: "modules/foundry-guardian/templates/admin-config.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    if (!isAuthorized()) {
      queueMicrotask(() => {
        this.close();
        notifyDenied();
      });
      return context;
    }

    const selectedIds = new Set(getAdminIds());
    const gmUsers = game.users
      .filter(user => user.isGM)
      .map(user => ({
        id: user.id,
        name: user.name,
        active: user.active,
        color: user.color?.css ?? user.color ?? "#888888",
        roleLabel: user.roleLabel ?? "Game Master",
        selected: selectedIds.size === 0 ? user.id === game.user.id : selectedIds.has(user.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));

    const selectedAdminCount = gmUsers.filter(user => user.selected).length;

    return {
      ...context,
      bootstrapMode: selectedIds.size === 0,
      gmUsers,
      selectedAdminCount,
      singleSelectedAdmin: selectedAdminCount === 1,
      protections: getProtections()
    };
  }

  static async #onSubmit(event, form) {
    if (!isAuthorized()) {
      notifyDenied();
      return;
    }

    const adminIds = [...form.querySelectorAll('input[name="adminIds"]:checked')]
      .map(input => input.value)
      .filter(id => game.users.has(id) && game.users.get(id).isGM);

    if (adminIds.length === 0) {
      ui.notifications?.error("Foundry Guardian : sélectionnez au moins un administrateur.");
      return false;
    }

    const protections = {
      settings: form.querySelector('[name="protectSettings"]')?.checked ?? false,
      modules: form.querySelector('[name="protectModules"]')?.checked ?? false,
      users: form.querySelector('[name="protectUsers"]')?.checked ?? false,
      world: form.querySelector('[name="protectWorld"]')?.checked ?? false,
      setup: form.querySelector('[name="protectSetup"]')?.checked ?? false
    };

    await game.settings.set(MODULE_ID, "adminIds", JSON.stringify(adminIds));
    await game.settings.set(MODULE_ID, "protections", JSON.stringify(protections));

    ui.notifications?.info(localizeOr("FG.Saved", "Foundry Guardian : accès enregistrés."));

    // Re-render the Settings sidebar so newly restricted clients lose controls immediately.
    ui.settings?.render?.({ force: true });
  }
}

function enhanceGuardianConfig(app, element) {
  if (!(app instanceof GuardianConfig)) return;

  const root = element instanceof Element ? element : app?.element;
  if (!(root instanceof Element) || root.dataset.fgEnhanced === "true") return;
  root.dataset.fgEnhanced = "true";

  const search = root.querySelector(".fg-user-search");
  const rows = [...root.querySelectorAll(".fg-user-row")];
  const inputs = [...root.querySelectorAll('input[name="adminIds"]')];
  const count = root.querySelector(".fg-admin-count");
  const empty = root.querySelector(".fg-empty-search");

  const updateCount = () => {
    const selected = inputs.filter(input => input.checked).length;
    if (count) count.textContent = `${selected} sélectionné${selected === 1 ? "" : "s"}`;
  };

  const filterRows = () => {
    const query = (search?.value ?? "").trim().toLocaleLowerCase(game.i18n?.lang ?? "fr");
    let visible = 0;

    for (const row of rows) {
      const name = (row.dataset.fgUserName ?? row.textContent ?? "").toLocaleLowerCase(game.i18n?.lang ?? "fr");
      const matches = !query || name.includes(query);
      row.hidden = !matches;
      if (matches) visible += 1;
    }

    if (empty) empty.hidden = visible > 0;
  };

  search?.addEventListener("input", filterRows);
  for (const input of inputs) input.addEventListener("change", updateCount);

  updateCount();
  filterRows();
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "adminIds", {
    scope: "world",
    config: false,
    type: String,
    default: "[]"
  });

  game.settings.register(MODULE_ID, "protections", {
    scope: "world",
    config: false,
    type: String,
    default: JSON.stringify(DEFAULT_PROTECTIONS)
  });

  game.settings.registerMenu(MODULE_ID, "guardianConfig", {
    name: "Accès administrateur",
    label: "Gérer les accès",
    hint: "Choisissez les MJ qui peuvent modifier les réglages importants de Foundry et de ce monde.",
    icon: "fa-solid fa-shield-halved",
    type: GuardianConfig,
    restricted: true
  });
});

Hooks.once("ready", () => {
  document.addEventListener("click", captureProtectedClicks, true);
  removeProtectedSettingsControls(document);

  console.log(`${MODULE_ID} | Ready. Authorized: ${isAuthorized()}`);
});

Hooks.on("renderApplicationV2", (app, element) => {
  enhanceGuardianConfig(app, element);
  if (!game.ready) return;

  // Keep protected controls out of the Settings sidebar.
  removeProtectedSettingsControls(element ?? app?.element ?? document);

  if (isAuthorized()) return;

  const protection = getApplicationProtection(app);
  if (!protection || !isProtected(protection)) return;

  // Fallback guard: even if a protected application is opened outside the sidebar,
  // close it as soon as it renders.
  queueMicrotask(async () => {
    try {
      await app.close();
    } finally {
      notifyDenied();
    }
  });
});

Hooks.on("renderApplicationV1", (app, html) => {
  if (!game.ready || isAuthorized()) return;

  const protection = getApplicationProtection(app);
  if (!protection || !isProtected(protection)) return;

  queueMicrotask(async () => {
    try {
      await app.close();
    } finally {
      notifyDenied();
    }
  });
});

Hooks.on("updateSetting", setting => {
  if (![`${MODULE_ID}.adminIds`, `${MODULE_ID}.protections`].includes(setting.key)) return;
  removeProtectedSettingsControls(document);
  ui.settings?.render?.({ force: true });
});

// Small public API for debugging and integrations.
Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;
  module.api = {
    isAuthorized,
    getAdminIds,
    getProtections,
    openConfig: () => {
      if (!isAuthorized()) return notifyDenied();
      return new GuardianConfig().render({ force: true });
    }
  };
});
