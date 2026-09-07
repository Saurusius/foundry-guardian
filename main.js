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

const ROLE_LABELS = Object.freeze({
  0: "Bloqué",
  1: "Joueur",
  2: "Joueur de confiance",
  3: "Assistant MJ",
  4: "Game Master"
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
  if (adminIds.length === 0) return true;
  return adminIds.includes(user.id);
}

function isProtected(key) {
  return Boolean(getProtections()[key]);
}

function notifyDenied() {
  ui.notifications?.warn(localizeOr("FG.Denied", "Foundry Guardian : cet accès est réservé aux administrateurs autorisés."));
}

function roleOptions(selectedRole = 1) {
  return Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
    selected: Number(value) === Number(selectedRole)
  }));
}

function gameMasterCount(excludingId = null) {
  const gmRole = CONST.USER_ROLES.GAMEMASTER;
  return game.users.filter(user => user.id !== excludingId && user.role === gmRole).length;
}

function settingsRootFor(element) {
  if (!(element instanceof Element)) return null;
  return element.closest('#settings, .settings-sidebar, [data-tab="settings"], [data-tab="configure"], .tab[data-tab="settings"]');
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


function captureGuardianUserManagerClick(event) {
  if (!(event.target instanceof Element)) return;
  const launcher = event.target.closest('.fg-open-users');
  if (!launcher) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (!isAuthorized()) return notifyDenied();

  const module = game.modules.get(MODULE_ID);
  if (module?.api?.openUsers) return module.api.openUsers();
  return new GuardianUsers().render({ force: true });
}

function captureProtectedClicks(event) {
  if (isAuthorized()) return;
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest("[data-action]");
  if (!control || !settingsRootFor(control)) return;
  const protection = ACTION_PROTECTION_MAP[control.dataset.action];
  if (!protection || !isProtected(protection)) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  notifyDenied();
}

function getApplicationProtection(app) {
  const name = app?.constructor?.name;
  if (name && PROTECTED_APPLICATIONS[name]) return PROTECTED_APPLICATIONS[name];
  const SettingsConfig = foundry?.applications?.settings?.SettingsConfig;
  if (SettingsConfig && app instanceof SettingsConfig) return "settings";
  return null;
}

async function confirmAction({ title, content, yes = "Confirmer", no = "Annuler" }) {
  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (DialogV2?.confirm) {
    return DialogV2.confirm({
      window: { title },
      content,
      yes: { label: yes, icon: "fa-solid fa-check" },
      no: { label: no, icon: "fa-solid fa-xmark" }
    });
  }
  return window.confirm(`${title}\n\n${content.replace(/<[^>]*>/g, "")}`);
}


function openGuardianUsersAction(event, target) {
  if (!isAuthorized()) return notifyDenied();
  return new GuardianUsers().render({ force: true });
}

async function createGuardianUserAction(event, target) {
  if (!isAuthorized()) return notifyDenied();
  const root = this.element;
  const name = root.querySelector('[name="newName"]')?.value?.trim();
  const role = Number(root.querySelector('[name="newRole"]')?.value ?? CONST.USER_ROLES.PLAYER);
  const password = root.querySelector('[name="newPassword"]')?.value ?? "";
  const confirm = root.querySelector('[name="newPasswordConfirm"]')?.value ?? "";

  if (!name) return ui.notifications?.warn("Foundry Guardian : saisissez un nom d'utilisateur.");
  if (game.users.some(user => user.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return ui.notifications?.warn("Foundry Guardian : ce nom d'utilisateur existe déjà.");
  }
  if (password !== confirm) return ui.notifications?.error("Foundry Guardian : les deux mots de passe ne correspondent pas.");

  if (role === CONST.USER_ROLES.GAMEMASTER) {
    const ok = await confirmAction({ title: "Créer un Game Master ?", content: `<p><strong>${name}</strong> recevra tous les pouvoirs d'un Game Master Foundry.</p>` });
    if (!ok) return;
  }

  const data = { name, role };
  if (password) data.password = password;
  await User.create(data);
  ui.notifications?.info(localizeOr("FG.UserCreated", "Foundry Guardian : utilisateur créé."));
  return this.render({ force: true });
}

async function saveGuardianUserAction(event, target) {
  if (!isAuthorized()) return notifyDenied();
  const row = target.closest('.fg-managed-user');
  const user = game.users.get(row?.dataset.userId);
  if (!row || !user) return;

  const name = row.querySelector('[name="name"]')?.value?.trim();
  const role = Number(row.querySelector('[name="role"]')?.value ?? user.role);
  const password = row.querySelector('[name="password"]')?.value ?? "";
  if (!name) return ui.notifications?.warn("Foundry Guardian : le nom ne peut pas être vide.");
  if (game.users.some(other => other.id !== user.id && other.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return ui.notifications?.warn("Foundry Guardian : ce nom d'utilisateur existe déjà.");
  }
  if (user.role === CONST.USER_ROLES.GAMEMASTER && role !== CONST.USER_ROLES.GAMEMASTER && gameMasterCount(user.id) === 0) {
    return ui.notifications?.error("Foundry Guardian : impossible de rétrograder le dernier Game Master.");
  }
  if (role === CONST.USER_ROLES.GAMEMASTER && user.role !== CONST.USER_ROLES.GAMEMASTER) {
    const ok = await confirmAction({ title: "Promouvoir en Game Master ?", content: `<p><strong>${name}</strong> recevra tous les pouvoirs d'un Game Master Foundry.</p>` });
    if (!ok) return;
  }

  const update = { name, role };
  if (password) update.password = password;
  await user.update(update);
  ui.notifications?.info(localizeOr("FG.UserUpdated", "Foundry Guardian : utilisateur mis à jour."));
  return this.render({ force: true });
}

async function deleteGuardianUserAction(event, target) {
  if (!isAuthorized()) return notifyDenied();
  const row = target.closest('.fg-managed-user');
  const user = game.users.get(row?.dataset.userId);
  if (!row || !user) return;
  if (user.id === game.user.id) return ui.notifications?.error("Foundry Guardian : vous ne pouvez pas supprimer votre propre compte.");
  if (user.role === CONST.USER_ROLES.GAMEMASTER && gameMasterCount(user.id) === 0) {
    return ui.notifications?.error("Foundry Guardian : impossible de supprimer le dernier Game Master.");
  }

  const ok = await confirmAction({ title: "Supprimer cet utilisateur ?", content: `<p>Le profil <strong>${user.name}</strong> sera supprimé du monde.</p><p>Cette action est irréversible.</p>`, yes: "Supprimer" });
  if (!ok) return;
  await user.delete();
  const admins = getAdminIds();
  if (admins.includes(user.id)) {
    await game.settings.set(MODULE_ID, "adminIds", JSON.stringify(admins.filter(id => id !== user.id)));
  }
  ui.notifications?.info(localizeOr("FG.UserDeleted", "Foundry Guardian : utilisateur supprimé."));
  return this.render({ force: true });
}

class GuardianUsers extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "foundry-guardian-users",
    classes: ["foundry-guardian", "foundry-guardian-users"],
    tag: "section",
    position: { width: 760, height: 720 },
    window: {
      title: "Foundry Guardian — Utilisateurs",
      icon: "fa-solid fa-users-gear",
      resizable: true
    },
    actions: {
      "create-user": createGuardianUserAction,
      "save-user": saveGuardianUserAction,
      "delete-user": deleteGuardianUserAction
    }
  };

  static PARTS = {
    main: { template: "modules/foundry-guardian/templates/user-manager.hbs" }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    if (!(root instanceof Element)) return;

    const createButton = root.querySelector('[data-action="create-user"]');
    createButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      createGuardianUserAction.call(this, event, event.currentTarget);
    });

    for (const button of root.querySelectorAll('[data-action="save-user"]')) {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        saveGuardianUserAction.call(this, event, event.currentTarget);
      });
    }

    for (const button of root.querySelectorAll('[data-action="delete-user"]')) {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        deleteGuardianUserAction.call(this, event, event.currentTarget);
      });
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    if (!isAuthorized()) {
      queueMicrotask(() => { this.close(); notifyDenied(); });
      return context;
    }

    const guardianAdmins = new Set(getAdminIds());
    const users = game.users
      .map(user => ({
        id: user.id,
        name: user.name,
        active: user.active,
        color: user.color?.css ?? user.color ?? "#888888",
        role: user.role,
        roleLabel: ROLE_LABELS[user.role] ?? user.roleLabel ?? String(user.role),
        roles: roleOptions(user.role),
        isSelf: user.id === game.user.id,
        isGuardianAdmin: guardianAdmins.includes(user.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, game.i18n?.lang ?? "fr"));

    return { ...context, users, singleUser: users.length === 1, roles: roleOptions(CONST.USER_ROLES.PLAYER) };
  }
}

class GuardianConfig extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "foundry-guardian-config",
    classes: ["foundry-guardian"],
    tag: "form",
    position: { width: 610, height: "auto" },
    window: {
      title: "Foundry Guardian — Gestion des accès",
      icon: "fa-solid fa-shield-halved",
      resizable: true
    },
    form: { closeOnSubmit: true, handler: GuardianConfig.#onSubmit },
    actions: {
      "open-user-manager": openGuardianUsersAction
    }
  };

  static PARTS = {
    form: { template: "modules/foundry-guardian/templates/admin-config.hbs" }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    if (!(root instanceof Element)) return;

    const createButton = root.querySelector('[data-fg-action="create-user"]');
    createButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      createGuardianUserAction.call(this, event, event.currentTarget);
    });

    for (const button of root.querySelectorAll('[data-fg-action="save-user"]')) {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        saveGuardianUserAction.call(this, event, event.currentTarget);
      });
    }

    for (const button of root.querySelectorAll('[data-fg-action="delete-user"]')) {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        deleteGuardianUserAction.call(this, event, event.currentTarget);
      });
    }

    const managedSearch = root.querySelector(".fg-managed-user-search");
    const managedRows = [...root.querySelectorAll(".fg-managed-user")];
    const managedEmpty = root.querySelector(".fg-managed-empty");
    const filterManagedUsers = () => {
      const query = (managedSearch?.value ?? "").trim().toLocaleLowerCase(game.i18n?.lang ?? "fr");
      let visible = 0;
      for (const row of managedRows) {
        const name = (row.dataset.userName ?? "").toLocaleLowerCase(game.i18n?.lang ?? "fr");
        const show = !query || name.includes(query);
        row.hidden = !show;
        if (show) visible += 1;
      }
      if (managedEmpty) managedEmpty.hidden = visible > 0;
    };
    managedSearch?.addEventListener("input", filterManagedUsers);
    filterManagedUsers();

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

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    if (!isAuthorized()) {
      queueMicrotask(() => { this.close(); notifyDenied(); });
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
    const guardianAdmins = new Set(getAdminIds());
    const managedUsers = game.users
      .map(user => ({
        id: user.id,
        name: user.name,
        active: user.active,
        color: user.color?.css ?? user.color ?? "#888888",
        role: user.role,
        roleLabel: ROLE_LABELS[user.role] ?? user.roleLabel ?? String(user.role),
        roles: roleOptions(user.role),
        isSelf: user.id === game.user.id,
        isGuardianAdmin: guardianAdmins.has(user.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, game.i18n?.lang ?? "fr"));

    return {
      ...context,
      bootstrapMode: selectedIds.size === 0,
      gmUsers,
      selectedAdminCount,
      singleSelectedAdmin: selectedAdminCount === 1,
      protections: getProtections(),
      managedUsers,
      managedUserCount: managedUsers.length,
      singleManagedUser: managedUsers.length === 1,
      newUserRoles: roleOptions(CONST.USER_ROLES.PLAYER)
    };
  }

  static async #onSubmit(event, form) {
    if (!isAuthorized()) return notifyDenied();
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
    ui.settings?.render?.({ force: true });
  }
}

function enhanceGuardianConfig(app, element) {
  if (!(app instanceof GuardianConfig)) return;
  const root = element instanceof Element ? element : app?.element;
  if (!(root instanceof Element) || root.dataset.fgEnhanced === "true") return;
  root.dataset.fgEnhanced = "true";

  // Foundry v14 ApplicationV2 action delegation can vary depending on how a
  // registered settings menu is mounted. Bind this critical launcher directly
  // so the user manager always opens when the visible button is clicked.
  const openUsers = root.querySelector(".fg-open-users");
  openUsers?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthorized()) return notifyDenied();
    new GuardianUsers().render({ force: true });
  });

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

function enhanceGuardianUsers(app, element) {
  if (!(app instanceof GuardianUsers)) return;
  const root = element instanceof Element ? element : app?.element;
  if (!(root instanceof Element) || root.dataset.fgEnhanced === "true") return;
  root.dataset.fgEnhanced = "true";

  // Same reliability strategy as the main Guardian launcher: explicit DOM
  // listeners for every account-management action.
  root.querySelector('[data-action="create-user"]')?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    createGuardianUserAction.call(app, event, event.currentTarget);
  });

  for (const button of root.querySelectorAll('[data-action="save-user"]')) {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      saveGuardianUserAction.call(app, event, event.currentTarget);
    });
  }

  for (const button of root.querySelectorAll('[data-action="delete-user"]')) {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      deleteGuardianUserAction.call(app, event, event.currentTarget);
    });
  }

  const search = root.querySelector(".fg-managed-user-search");
  const rows = [...root.querySelectorAll(".fg-managed-user")];
  const empty = root.querySelector(".fg-empty-search");
  const filter = () => {
    const query = (search?.value ?? "").trim().toLocaleLowerCase(game.i18n?.lang ?? "fr");
    let visible = 0;
    for (const row of rows) {
      const name = (row.dataset.userName ?? "").toLocaleLowerCase(game.i18n?.lang ?? "fr");
      const show = !query || name.includes(query);
      row.hidden = !show;
      if (show) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
  };
  search?.addEventListener("input", filter);
  filter();
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "adminIds", { scope: "world", config: false, type: String, default: "[]" });
  game.settings.register(MODULE_ID, "protections", { scope: "world", config: false, type: String, default: JSON.stringify(DEFAULT_PROTECTIONS) });
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
  // Critical launcher delegate: capture the click before Foundry's settings form
  // or any ApplicationV2 event delegation can consume it.
  document.addEventListener("click", captureGuardianUserManagerClick, true);
  document.addEventListener("click", captureProtectedClicks, true);
  removeProtectedSettingsControls(document);
  console.log(`${MODULE_ID} | Ready. Authorized: ${isAuthorized()}`);
});

Hooks.on("renderApplicationV2", (app, element) => {
  enhanceGuardianConfig(app, element);
  enhanceGuardianUsers(app, element);
  if (!game.ready) return;
  removeProtectedSettingsControls(element ?? app?.element ?? document);
  if (isAuthorized()) return;
  const protection = getApplicationProtection(app);
  if (!protection || !isProtected(protection)) return;
  queueMicrotask(async () => {
    try { await app.close(); } finally { notifyDenied(); }
  });
});

Hooks.on("renderApplicationV1", (app) => {
  if (!game.ready || isAuthorized()) return;
  const protection = getApplicationProtection(app);
  if (!protection || !isProtected(protection)) return;
  queueMicrotask(async () => {
    try { await app.close(); } finally { notifyDenied(); }
  });
});

Hooks.on("updateSetting", setting => {
  if (![`${MODULE_ID}.adminIds`, `${MODULE_ID}.protections`].includes(setting.key)) return;
  removeProtectedSettingsControls(document);
  ui.settings?.render?.({ force: true });
});

Hooks.once("ready", async () => {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    isAuthorized,
    getAdminIds,
    getProtections,
    openConfig: () => {
      if (!isAuthorized()) return notifyDenied();
      return new GuardianConfig().render({ force: true });
    },
    openUsers: () => {
      if (!isAuthorized()) return notifyDenied();
      const app = new GuardianConfig();
      const rendered = app.render({ force: true });
      setTimeout(() => {
        const details = app.element?.querySelector?.(".fg-user-management");
        if (details) {
          details.open = true;
          details.scrollIntoView?.({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return rendered;
    }
  };

  // Create convenient launcher macros for Guardian administrators.
  if (!isAuthorized()) return;
  try {
    const existing = game.macros?.find(macro => macro.getFlag?.(MODULE_ID, "launcher") === true);
    if (!existing) {
      await Macro.create({
        name: "Foundry Guardian",
        type: "script",
        scope: "global",
        img: "icons/svg/shield.svg",
        command: 'game.modules.get("foundry-guardian")?.api?.openConfig();',
        flags: { [MODULE_ID]: { launcher: true } }
      });
    }

    const existingUsers = game.macros?.find(macro => macro.getFlag?.(MODULE_ID, "userLauncher") === true);
    if (!existingUsers) {
      await Macro.create({
        name: "Foundry Guardian — Utilisateurs",
        type: "script",
        scope: "global",
        img: "icons/svg/mystery-man.svg",
        command: 'game.modules.get("foundry-guardian")?.api?.openUsers();',
        flags: { [MODULE_ID]: { userLauncher: true } }
      });
      ui.notifications?.info("Foundry Guardian : macro « Utilisateurs » créée dans le répertoire des macros.");
    }
  } catch (error) {
    console.warn(`${MODULE_ID} | Impossible de créer automatiquement les macros Guardian`, error);
  }
});
