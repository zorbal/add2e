export const registerSettings = function () {

  game.settings.register("add2e", "initiative", {
    name: game.i18n.localize("ADD2E.Setting.Initiative"),
    hint: game.i18n.localize("ADD2E.Setting.InitiativeHint"),
    default: "group",
    scope: "world",
    type: String,
    config: true,
    choices: {
      individual: "ADD2E.Setting.InitiativeIndividual",
      group: "ADD2E.Setting.InitiativeGroup",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("add2e", "rerollInitiative", {
    name: game.i18n.localize("ADD2E.Setting.RerollInitiative"),
    hint: game.i18n.localize("ADD2E.Setting.RerollInitiativeHint"),
    default: "reset",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "ADD2E.Setting.InitiativeKeep",
      reset: "ADD2E.Setting.InitiativeReset",
      reroll: "ADD2E.Setting.InitiativeReroll",
    }
  });


  game.settings.register("add2e", "dexterityInitiative", {
    name: game.i18n.localize("ADD2E.Setting.DexterityInitiative"),
    hint: game.i18n.localize("ADD2E.Setting.DexterityInitiativeHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("add2e", "ascendingAC", {
    name: game.i18n.localize("ADD2E.Setting.AscendingAC"),
    hint: game.i18n.localize("ADD2E.Setting.AscendingACHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("add2e", "morale", {
    name: game.i18n.localize("ADD2E.Setting.Morale"),
    hint: game.i18n.localize("ADD2E.Setting.MoraleHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
  });

  game.settings.register("add2e", "encumbranceOption", {
    name: game.i18n.localize("ADD2E.Setting.Encumbrance"),
    hint: game.i18n.localize("ADD2E.Setting.EncumbranceHint"),
    default: "detailed",
    scope: "world",
    type: String,
    config: true,
    choices: {
      disabled: "ADD2E.Setting.EncumbranceDisabled",
      basic: "ADD2E.Setting.EncumbranceBasic",
      detailed: "ADD2E.Setting.EncumbranceDetailed",
      complete: "ADD2E.Setting.EncumbranceComplete",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("add2e", "significantTreasure", {
    name: game.i18n.localize("ADD2E.Setting.SignificantTreasure"),
    hint: game.i18n.localize("ADD2E.Setting.SignificantTreasureHint"),
    default: 800,
    scope: "world",
    type: Number,
    config: true,
    onChange: _ => window.location.reload()
  });
};
