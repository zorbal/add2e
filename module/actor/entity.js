import { Add2eDice } from "../dice.js";

export class Add2eActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();
    const data = this.data.data;

    // Compute modifiers from actor scores
    this.computeModifiers();
    this._isSlow();
    this.computeEncumbrance();
    this.computeAC();
    this.computeTreasure();

    // Determine Initiative
    if (game.settings.get("add2e", "initiative") != "group") {
      data.initiative.value = data.initiative.mod;
      if (this.data.type == "character" && game.settings.get("add2e", "dexterityInitiative")) {
        data.initiative.value -= data.scores.dex.dreaction;
      }
    } else {
      data.initiative.value = 0;
    }
    data.movement.encounter = data.movement.base / 3;
  }
  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
    /* -------------------------------------------- */
  getExperience(value, options = {}) {
    if (this.data.type != "character") {
      return;
    }
    let modified = Math.floor(
      value + (this.data.data.details.xp.bonus * value) / 100
    );
    return this.update({
      "data.details.xp.value": modified + this.data.data.details.xp.value,
    }).then(() => {
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        content: game.i18n.format("ADD2E.messages.GetExperience", {
          name: this.name,
          value: modified,
        }),
        speaker,
      });
    });
  }

  isNew() {
    const data = this.data.data;
    if (this.data.type == "character") {
      let ct = 0;
      Object.values(data.scores).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    } else if (this.data.type == "monster") {
      let ct = 0;
      Object.values(data.saves).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    }
  }

  generateSave(hd) {
    let saves = {};
    for (let i = 0; i <= hd; i++) {
      let tmp = CONFIG.ADD2E.monster_saves[i];
      if (tmp) {
        saves = tmp;
      }
    }
    this.update({
      "data.saves": {
        death: {
          value: saves.d,
        },
        wand: {
          value: saves.w,
        },
        petrify: {
          value: saves.p,
        },
        breath: {
          value: saves.b,
        },
        spell: {
          value: saves.s,
        },
      },
    });
  }

  /* -------------------------------------------- */
  /*  Rolls                                       */
  /* -------------------------------------------- */

  rollHP(options = {}) {
    let roll = new Roll(this.data.data.hp.hd).roll();
    return this.update({
      data: {
        hp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollSave(save, options = {}) {
    const label = game.i18n.localize(`ADD2E.saves.${save}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "above",
        target: this.data.data.saves[save].value,
        magic: this.data.type === "character" ? this.data.data.scores.wis.magdef : 0,
      },
      details: game.i18n.format("ADD2E.roll.details.save", { save: label }),
    };

    let skip = options.event && options.event.ctrlKey;

    const rollMethod = this.data.type == "character" ? Add2eDice.RollSave : Add2eDice.Roll;

    // Roll and return
    return rollMethod({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("ADD2E.roll.save", { save: label }),
      title: game.i18n.format("ADD2E.roll.save", { save: label }),
    });
  }

  rollMorale(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.details.morale,
      },
    };

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("ADD2E.roll.morale"),
      title: game.i18n.localize("ADD2E.roll.morale"),
    });
  }

  rollLoyalty(options = {}) {
    const label = game.i18n.localize(`ADD2E.roll.loyalty`);
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.henchmen.loyalty,
      },
    };

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollReaction(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "table",
        table: {
          2: game.i18n.format("ADD2E.reaction.Hostile", {
            name: this.data.name,
          }),
          3: game.i18n.format("ADD2E.reaction.Unfriendly", {
            name: this.data.name,
          }),
          6: game.i18n.format("ADD2E.reaction.Neutral", {
            name: this.data.name,
          }),
          9: game.i18n.format("ADD2E.reaction.Indifferent", {
            name: this.data.name,
          }),
          12: game.i18n.format("ADD2E.reaction.Friendly", {
            name: this.data.name,
          }),
        },
      },
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("ADD2E.reaction.check"),
      title: game.i18n.localize("ADD2E.reaction.check"),
    });
  }

  rollCheck(score, options = {}) {
    const label = game.i18n.localize(`ADD2E.scores.${score}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "check",
        target: this.data.data.scores[score].value,
      },

      details: game.i18n.format("ADD2E.roll.details.attribute", {
        score: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("ADD2E.roll.attribute", { attribute: label }),
      title: game.i18n.format("ADD2E.roll.attribute", { attribute: label }),
    });
  }

  rollHitDice(options = {}) {
    const label = game.i18n.localize(`ADD2E.roll.hd`);
    const rollParts = [this.data.data.hp.hd];
    if (this.data.type == "character") {
      rollParts.push(this.data.data.scores.con.hpadj);
    }

    const data = {
      actor: this.data,
      roll: {
        type: "hitdice",
      },
    };

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollAppearing(options = {}) {
    const rollParts = [];
    let label = "";
    if (options.check == "wilderness") {
      rollParts.push(this.data.data.details.appearing.w);
      label = "(2)";
    } else {
      rollParts.push(this.data.data.details.appearing.d);
      label = "(1)";
    }
    const data = {
      actor: this.data,
      roll: {
        type: {
          type: "appearing",
        },
      },
    };

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("ADD2E.roll.appearing", { type: label }),
      title: game.i18n.format("ADD2E.roll.appearing", { type: label }),
    });
  }

  rollExploration(expl, options = {}) {
    const label = game.i18n.localize(`ADD2E.exploration.${expl}.long`);
    const rollParts = ["1d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.exploration[expl],
      },
      details: game.i18n.format("ADD2E.roll.details.exploration", {
        expl: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("ADD2E.roll.exploration", { exploration: label }),
      title: game.i18n.format("ADD2E.roll.exploration", { exploration: label }),
    });
  }

  rollDamage(attData, options = {}) {
    const data = this.data.data;

    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: "damage",
      },
    };

    let dmgParts = [];
    if (!attData.roll.dmg) {
      dmgParts.push("1d6");
    } else {
      dmgParts.push(attData.roll.dmg);
    }

    // Add Str to damage
    if (attData.roll.type == "melee") {
      dmgParts.push(data.scores.str.dmgadj);
    }

    // Damage roll
    Add2eDice.Roll({
      event: options.event,
      parts: dmgParts,
      data: rollData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${attData.label} - ${game.i18n.localize("ADD2E.Damage")}`,
      title: `${attData.label} - ${game.i18n.localize("ADD2E.Damage")}`,
    });
  }

  async targetAttack(data, type, options) {
    if (game.user.targets.size > 0) {
      for (let t of game.user.targets.values()) {
        data.roll.target = t;
        await this.rollAttack(data, {
          type: type,
          skipDialog: options.skipDialog,
        });
      }
    } else {
      this.rollAttack(data, { type: type, skipDialog: options.skipDialog });
    }
  }

  rollAttack(attData, options = {}) {
    const data = this.data.data;
    const rollParts = ["1d20"];
    const dmgParts = [];
    const dmgPartsL = [];

    let targetSize = attData.roll.target.actor.data.data.size;

    let label = game.i18n.format("ADD2E.roll.attacks", {
      name: this.data.name,
    });
    if (!attData.item) {
      dmgParts.push("1d6");
    } else {
      label = game.i18n.format("ADD2E.roll.attacksWith", {
        name: attData.item.name,
      });

      if (targetSize == "large" || 
          targetSize == "huge" || 
          targetSize == "gargantuan") {
        dmgParts.push(attData.item.data.damage.large);
      } else {
        dmgParts.push(attData.item.data.damage.medium);
      }
    }

    let ascending = game.settings.get("add2e", "ascendingAC");
    if (ascending) {
      rollParts.push(data.thac0.bba.toString());
    }
    if (options.type == "missile") {
      rollParts.push(
        data.scores.dex.missileadj.toString(),
        data.thac0.mod.missile.toString(),
        data.encumbrance.attackmod.toString()
      );
    } else if (options.type == "melee") {
      rollParts.push(
        data.scores.str.hitprob.toString(),
        data.thac0.mod.melee.toString(),
        data.encumbrance.attackmod.toString()
      );
    }
    if (attData.item && attData.item.data.bonus) {
      rollParts.push(attData.item.data.bonus);
    }
    let thac0 = data.thac0.value;
    if (options.type == "melee") {
      dmgParts.push(data.scores.str.dmgadj);
      dmgPartsL.push(data.scores.str.dmgadj);
    }
    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: options.type,
        thac0: thac0,
        dmg: dmgParts,
        dmdL: dmgPartsL,
        save: attData.roll.save,
        target: attData.roll.target,
      },
    };

    // Roll and return
    return Add2eDice.Roll({
      event: options.event,
      parts: rollParts,
      data: rollData,
      skipDialog: options.skipDialog,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  async applyDamage(amount = 0, multiplier = 1) {
    amount = Math.floor(parseInt(amount) * multiplier);
    const hp = this.data.data.hp;

    // Remaining goes to health
    const dh = Math.clamped(hp.value - amount, 0, hp.max);

    // Update the Actor
    return this.update({
      "data.hp.value": dh,
    });
  }

  static _valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  _isSlow() {
    this.data.data.isSlow = false;
    if (this.data.type != "character") {
      return;
    }
    this.data.items.forEach((item) => {
      if (item.type == "weapon" && item.data.slow && item.data.equipped) {
        this.data.data.isSlow = true;
        return;
      }
    });
  }

  computeEncumbrance() {

    if (this.data.type != "character") {
      return;
    }

  const encumbranceLight = {
      0: 0,
      2: 2,
      3: 6,
      4: 11,
      6: 21,
      8: 36,
      10: 41,
      12: 46,
      14: 56,
      16: 71,
      17: 86,
      18: 111,
   };

  const encumbranceLightEx = {
      0: 336,
      1: 136,
      51: 161,
      76: 186,
      91: 236,
      100: 336,
  };

   const encumbranceModerate = {
      0: 0,
      2: 3,
      3: 7,
      4: 14,
      6: 30,
      8: 51,
      10: 59,
      12: 70,
      14: 86,
      16: 101,
      17: 122,
      18: 150,
   };

  const encumbranceModerateEx = {
      0: 375,
      1: 175,
      51: 200,
      76: 235,
      91: 275,
      100: 375,
  };

   const encumbranceHeavy = {
      0: 0,
      2: 4,
      3: 8,
      4: 17,
      6: 39,
      8: 66,
      10: 77,
      12: 94,
      14: 116,
      16: 131,
      17: 158,
      18: 189,
   };

  const encumbranceHeavyEx = {
      0: 414,
      1: 214,
      51: 239,
      76: 264,
      91: 314,
      100: 414,
  };

   const encumbranceSevere = {
      0: 0,
      2: 5,
      3: 10,
      4: 20,
      6: 47,
      8: 81,
      10: 97,
      12: 118,
      14: 146,
      16: 161,
      17: 194,
      18: 228,
   };

  const encumbranceSevereEx = {
      0: 453,
      1: 253,
      51: 278,
      76: 303,
      91: 353,
      100: 453,
  };

   const encumbranceMax = {
      0: 0,
      2: 6,
      3: 10,
      4: 25,
      6: 55,
      8: 90,
      10: 110,
      12: 140,
      14: 170,
      16: 195,
      17: 220,
      18: 255,
   };

  const encumbranceMaxEx = {
      0: 480,
      1: 280,
      51: 305,
      76: 330,
      91: 380,
      100: 480,
  };


    const data = this.data.data;
    let option = game.settings.get("add2e", "encumbranceOption");

    let enc_light = 0;
    let enc_moderate = 0;
    let enc_heavy = 0;
    let enc_severe = 0;
    let enc_max = 0;
    let attackmod = 0;
    let armormod = 0;

    if (data.scores.str.value == 18 && data.exstr.enabled) {
     enc_light = Add2eActor._valueFromTable(encumbranceLightEx, data.scores.str.ex.value);
      enc_moderate = Add2eActor._valueFromTable(encumbranceModerateEx, data.scores.str.ex.value);
      enc_heavy = Add2eActor._valueFromTable(encumbranceHeavyEx, data.scores.str.ex.value);
      enc_severe = Add2eActor._valueFromTable(encumbranceSevereEx, data.scores.str.ex.value);
      enc_max = Add2eActor._valueFromTable(encumbranceMaxEx, data.scores.str.ex.value);
    } else {	
      enc_light = Add2eActor._valueFromTable(encumbranceLight, data.scores.str.value);
      enc_moderate = Add2eActor._valueFromTable(encumbranceModerate, data.scores.str.value);
      enc_heavy = Add2eActor._valueFromTable(encumbranceHeavy, data.scores.str.value);
      enc_severe = Add2eActor._valueFromTable(encumbranceSevere, data.scores.str.value);
      enc_max = Add2eActor._valueFromTable(encumbranceMax, data.scores.str.value);
    }

    // Compute encumbrance
    let totalWeight = 0;
    let hasItems = false;
    let enc_level = "none";
    Object.values(this.data.items).forEach((item) => {
      if (item.type == "item" && !item.data.treasure) {
        hasItems = true;
      }
      if (
        item.type == "item" &&
        (["complete", "disabled"].includes(option) || item.data.treasure)
      ) {
        totalWeight += item.data.quantity.value * item.data.weight;
      } else if (option != "basic" && ["weapon", "armor"].includes(item.type)) {
        totalWeight += item.data.weight;
      }
    });
 
    /* Add 5 lbs. for clothing) */
    totalWeight += 5;

    if (totalWeight < enc_light) {
      enc_level = "none";
    }
    else if (totalWeight >= enc_light && totalWeight < enc_moderate) {
      enc_level = "light";
    }
    else if (totalWeight >= enc_moderate && totalWeight < enc_heavy) {
      enc_level = "moderate";
      attackmod = -1;
    }
    else if (totalWeight >= enc_heavy && totalWeight < enc_severe) {
      enc_level = "heavy";
      attackmod = -2;
      armormod = 1;
    }
    else if (totalWeight >= enc_severe && totalWeight < enc_max) {
      enc_level = "severe";
      attackmod = -4;
      armormod = 3;
    }
    else {
      enc_level = "max";
    }

    data.encumbrance = {
      pct: Math.clamped((100 * parseFloat(totalWeight)) / enc_max, 0, 100),
      light: enc_light,
      moderate: enc_moderate,
      heavy: enc_heavy,
      severe: enc_severe,
      max: enc_max,
      level: enc_level,
      attackmod: attackmod,
      armormod: armormod,
      encumbered: totalWeight > enc_max,
      weight: totalWeight,
    };

    if (data.config.movementAuto && option != "disabled") {
      this._calculateMovement();
    }
  }

  _calculateMovement() {
    const data = this.data.data;
    let option = game.settings.get("add2e", "encumbranceOption");
    if (["detailed", "complete"].includes(option)) {


      if (data.encumbrance.level == "max") {
        data.movement.enc = 0;
      } else if (data.encumbrance.level == "none") {
        data.movement.enc = data.movement.base;
      } else if (data.encumbrance.level == "light") {
        data.movement.enc = data.movement.base - (data.movement.base / 3);
      } else if (data.encumbrance.level == "moderate") {
        data.movement.enc = data.movement.base / 2;
      } else if (data.encumbrance.level == "heavy") {
        data.movement.enc = data.movement.base / 3;
      } else {
        data.movement.enc = 1;
      }	

    } else if (option == "basic") {
      const armors = this.data.items.filter((i) => i.type == "armor");
      let heaviest = 0;
      armors.forEach((a) => {
        if (a.data.equipped) {
          if (a.data.type == "light" && heaviest == 0) {
            heaviest = 1;
          } else if (a.data.type == "heavy") {
            heaviest = 2;
          }
        }
      });
      switch (heaviest) {
        case 0:
          data.movement.enc = 120;
          break;
        case 1:
          data.movement.enc = 90;
          break;
        case 2:
          data.movement.enc = 60;
          break;
      }
      if (weight > game.settings.get("add2e", "significantTreasure")) {
        data.movement.enc -= 30;
      }
    }
  }

  computeTreasure() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;
    // Compute treasure
    let total = 0;
    let treasure = this.data.items.filter(
      (i) => i.type == "item" && i.data.treasure
    );
    treasure.forEach((item) => {
      total += item.data.quantity.value * item.data.cost;
    });
    data.treasure = total;
  }

  computeAC() {
    if (this.data.type != "character") {
      return;
    }
    // Compute AC
    let baseAc = 10;
    let baseAac = 10;
    let AcShield = 0;
    let AacShield = 0;
    const data = this.data.data;
    data.aac.naked = baseAac - data.scores.dex.defadj - data.encumbrance.armormod;
    data.ac.naked = baseAc + data.scores.dex.defadj + data.encumbrance.armormod;
    const armors = this.data.items.filter((i) => i.type == "armor");
    armors.forEach((a) => {
      if (a.data.equipped && a.data.type != "shield") {
        baseAc = a.data.ac.value;
        baseAac = a.data.aac.value;
      } else if (a.data.equipped && a.data.type == "shield") {
        AcShield = a.data.ac.value;
        AacShield = a.data.aac.value;
      }
    });
    data.aac.value = baseAac - data.scores.dex.defadj + AacShield + data.aac.mod - data.encumbrance.armormod;
    data.ac.value = baseAc + data.scores.dex.defadj - AcShield - data.ac.mod + data.encumbrance.armormod;;
    data.ac.shield = AcShield;
    data.aac.shield = AacShield;
  }

  computeModifiers() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;

    const hitprob = {
      0: 0,
      1: -5,
      2: -3,
      4: -2,
      6: -1,
      8: 0,
      17: 1,
      19: 3,
      21: 4,
      23: 5,
      24: 6,
      25: 7,
    };

    const hitprobex = {
      0: 3,
      1: 1,
      51: 2,
      100: 3,
    };

   const dmgadj = {
      0: 0,
      1: -4,
      2: -2,
      3: -1,
      6: 0,
      16: 1,
      18: 2,
      19: 7,
      20: 8,
      21: 9,
      22: 10,
      23: 11,
      24: 12,
      25: 14,
    };

    const dmgadjex = {
      0: 6,
      1: 3,
      76: 4,
      91: 5,
      100: 6,
    };

   const weightallow = {
      0: 0,
      1: 1,
      3: 5,
      4: 10,
      6: 20,
      8: 35,
      10: 40,
      12: 45,
      14: 55,
      16: 70,
      17: 85,
      18: 110,
      19: 485,
      20: 535,
      21: 635,
      22: 785,
      23: 935,
      24: 1235,
      25: 1535,
    };

    const weightallowex = {
      0: 335,
      1: 135,
      51: 160,
      76: 185,
      91: 235,
      100: 335,
    };

   const maxpress = {
      0: 0,
      1: 3,
      2: 5,
      3: 10,
      4: 25,
      6: 55,
      8: 90,
      10: 115,
      12: 140,
      14: 170,
      16: 195,
      17: 220,
      18: 255,
      19: 640,
      20: 700,
      21: 810,
      22: 970,
      23: 1130,
      24: 1440,
      25: 1750,
    };

    const maxpressex = {
      0: 480,
      1: 280,
      51: 305,
      76: 330,
      91: 380,
      100: 480,
    };

    const opendoors = {
      0: 0,
      1: 1,
      3: 2,
      4: 3,
      6: 4,
      8: 5,
      10: 6,
      12: 7,
      14: 8,
      16: 9,
      17: 10,
      18: 11,
      19: 16,
      20: 17,
      22: 18,
      24: 19,
    };

    const opendoorsex = {
      0: 16,
      1: 12,
      51: 13,
      76: 14,
      91: 15,
      100: 16,
    };

   const bendbars = {
      0: 0,
      8: 1,
      10: 2,
      12: 4,
      14: 7,
      16: 10,
      17: 13,
      18: 16,
      19: 50,
      20: 60,
      21: 70,
      22: 80,
      23: 90,
      24: 95,
      25: 99,
    };

    const bendbarsex = {
      0: 40,
      1: 20,
      51: 25,
      76: 30,
      91: 35,
      100: 40,
    };

   const dreaction = {
      0: 0,
      1: -6,
      2: -4,
      3: -3,
      4: -2,
      5: -1,
      6: 0,
      16: 1,
      17: 2,
      19: 3,
      21: 4,
      24: 5,
    };

   const missileadj = {
      0: 0,
      1: -6,
      2: -4,
      3: -3,
      4: -2,
      5: -1,
      6: 0,
      16: 1,
      17: 2,
      19: 3,
      21: 4,
      24: 5,
    };

   const defadj = {
      0: 0,
      1: 5,
      3: 4,
      4: 3,
      5: 2,
      6: 1,
      7: 0,
      15: -1,
      16: -2,
      17: -3,
      18: -4,
      21: -5,
      24: -6,
    };

   const hpadj = {
      0: 0,
      1: -3,
      2: -2,
      4: -1,
      7: 0,
      15: 1,
      16: 2,
    };

   const hpadjwarrior = {
      0: 0,
      1: -3,
      2: -2,
      4: -1,
      7: 0,
      15: 1,
      16: 2,
      17: 3,
      18: 4,
      19: 5,
      21: 6,
      24: 7,
    };

   const shock = {
      0: 0,
      1: 25,
      2: 30,
      3: 35,
      4: 40,
      5: 45,
      6: 50,
      7: 55,
      8: 60,
      9: 65,
      10: 70,
      11: 75,
      12: 80,
      13: 85,
      14: 88,
      15: 90,
      16: 95,
      17: 97,
      18: 99,
      25: 100,
    };

  const resurrection = {
      0: 0,
      1: 30,
      2: 35,
      3: 40,
      4: 45,
      5: 50,
      6: 55,
      7: 60,
      8: 65,
      9: 70,
      10: 75,
      11: 80,
      12: 85,
      13: 90,
      14: 92,
      15: 94,
      16: 96,
      17: 98,
      18: 100,
    };

   const poisonsave = {
      0: 0,
      1: -2,
      2: -1,
      3: 0,
      19: 1,
      21: 2,
      23: 3,
      25: 4,
    };

   const regen = {
      0: 0,
      20: 6,
      21: 5,
      22: 4,
      23: 3,
      24: 2,
      25: 1,
    };

   const numlang = {
      0: 0,
      2: 1,
      9: 2,
      12: 3,
      14: 4,
      16: 5,
      17: 6,
      18: 7,
      19: 8,
      20: 9,
      21: 10,
      22: 11,
      23: 12,
      24: 15,
      25: 20,
    };

   const spelllevel = {
      0: 0,
      9: 4,
      10: 5,
      12: 6,
      14: 7,
      16: 8,
      18: 9,
    };

   const learnspell = {
      0: 0,
      9: 35,
      10: 40,
      11: 45,
      12: 50,
      13: 55,
      14: 60,
      15: 65,
      16: 70,
      17: 75,
      18: 85,
      19: 95,
      20: 96,
      21: 97,
      22: 98,
      23: 99,
      24: 100,
    };

   const maxspells = {
      0: 0,
      9: 6,
      10: 7,
      13: 9,
      15: 11,
      17: 14,
      18: 18,
      19: 9999,
    };

   const illimmune = {
      0: 0,
      19: 1,
      20: 2,
      21: 3,
      22: 4,
      23: 5,
      24: 6,
      25: 7,
    };

   const magdef = {
      0: 0,
      1: -6,
      2: -4,
      3: -3,
      4: -2,
      5: -1,
      8: 0,
      15: 1,
      16: 2,
      17: 3,
      18: 4,
    };

   const bonusspells = {
      0: 0,
      13: 1,
      14: 2,
      15: 3,
      16: 4,
      17: 5,
      18: 6,
      19: 7,
      20: 8,
      21: 9,
      22: 10,
      23: 11,
      24: 12,
      25: 13,
    };

   const spellfail = {
      0: 0,
      1: 80,
      2: 60,
      3: 50,
      4: 45,
      5: 40,
      6: 35,
      7: 30,
      8: 25,
      9: 20,
      10: 15,
      11: 10,
      12: 5,
      13: 0,
    };

   const charmimmune = {
      1: 0,
      19: 1,
      20: 2,
      21: 3,
      22: 4,
      23: 5,
      24: 6,
      25: 7,
    };

   const maxhenchmen = {
      0: 0,
      2: 1,
      5: 2,
      7: 3,
      9: 4,
      12: 5,
      14: 6,
      15: 7,
      16: 8,
      17: 10,
      18: 15,
      19: 20,
      20: 25,
      21: 30,
      22: 35,
      23: 40,
      24: 45,
      25: 50,
    };

   const loyaltybase = {
      0: 0,
      1: -8,
      2: -7,
      3: -6,
      4: -5,
      5: -4,
      6: -3,
      7: -2,
      8: -1,
      9: 0,
      14: 1,
      15: 3,
      16: 4,
      17: 6,
      18: 8,
      19: 10,
      20: 12,
      21: 14,
      22: 16,
      23: 18,
      24: 20,
    };

   const creaction = {
      0: 0,
      1: -7,
      2: -6,
      3: -5,
      4: -4,
      5: -3,
      6: -2,
      7: -1,
      8: 0,
      13: 1,
      14: 2,
      15: 3,
      16: 5,
      17: 6,
      18: 7,
      19: 8,
      20: 9,
      21: 10,
      22: 11,
      23: 12,
      24: 13,
      25: 14,
    };



    if (data.scores.str.value == 18 && data.exstr.enabled) {
      data.scores.str.hitprob = Add2eActor._valueFromTable(hitprobex, data.scores.str.ex.value);
      data.scores.str.dmgadj = Add2eActor._valueFromTable(dmgadjex, data.scores.str.ex.value);
      data.scores.str.weightallow = Add2eActor._valueFromTable(weightallowex, data.scores.str.ex.value);
      data.scores.str.maxpress = Add2eActor._valueFromTable(maxpressex, data.scores.str.ex.value);
      data.scores.str.opendoors = Add2eActor._valueFromTable(opendoorsex, data.scores.str.ex.value);
      data.scores.str.bendbars = Add2eActor._valueFromTable(bendbarsex, data.scores.str.ex.value);
    }	
    else {
      data.scores.str.hitprob = Add2eActor._valueFromTable(hitprob, data.scores.str.value);
      data.scores.str.dmgadj = Add2eActor._valueFromTable(dmgadj, data.scores.str.value);
      data.scores.str.weightallow = Add2eActor._valueFromTable(weightallow, data.scores.str.value);
      data.scores.str.maxpress = Add2eActor._valueFromTable(maxpress, data.scores.str.value);
      data.scores.str.opendoors = Add2eActor._valueFromTable(opendoors, data.scores.str.value);
      data.scores.str.bendbars = Add2eActor._valueFromTable(bendbars, data.scores.str.value);
    }

    data.scores.dex.dreaction = Add2eActor._valueFromTable(dreaction, data.scores.dex.value);
    data.scores.dex.missileadj = Add2eActor._valueFromTable(missileadj, data.scores.dex.value);
    data.scores.dex.defadj = Add2eActor._valueFromTable(defadj, data.scores.dex.value);


    if (data.warriorhpadj.enabled) {
      data.scores.con.hpadj = Add2eActor._valueFromTable(hpadjwarrior, data.scores.con.value);
    }
    else {
      data.scores.con.hpadj = Add2eActor._valueFromTable(hpadj, data.scores.con.value);
    }
      data.scores.con.shock = Add2eActor._valueFromTable(shock, data.scores.con.value);
      data.scores.con.resurrection = Add2eActor._valueFromTable(resurrection, data.scores.con.value);
      data.scores.con.poisonsave = Add2eActor._valueFromTable(poisonsave, data.scores.con.value);
      data.scores.con.regen = Add2eActor._valueFromTable(regen, data.scores.con.value);

      data.scores.int.numlang = Add2eActor._valueFromTable(numlang, data.scores.int.value);
      data.scores.int.spelllevel = Add2eActor._valueFromTable(spelllevel, data.scores.int.value);
      data.scores.int.learnspell = Add2eActor._valueFromTable(learnspell, data.scores.int.value);
      data.scores.int.maxspells = Add2eActor._valueFromTable(maxspells, data.scores.int.value);
      data.scores.int.illimmune = Add2eActor._valueFromTable(illimmune, data.scores.int.value);

      data.scores.wis.magdef = Add2eActor._valueFromTable(magdef, data.scores.wis.value);
      data.scores.wis.bonusspells = Add2eActor._valueFromTable(bonusspells, data.scores.wis.value);
      data.scores.wis.spellfail = Add2eActor._valueFromTable(spellfail, data.scores.wis.value);
      data.scores.wis.charmimmune = Add2eActor._valueFromTable(charmimmune, data.scores.wis.value);


      data.scores.cha.maxhenchmen = Add2eActor._valueFromTable(maxhenchmen, data.scores.cha.value);
      data.scores.cha.loyaltybase = Add2eActor._valueFromTable(loyaltybase, data.scores.cha.value);
      data.scores.cha.creaction = Add2eActor._valueFromTable(creaction, data.scores.cha.value);


    const literacy = {
      0: "",
      3: "ADD2E.Illiterate",
      6: "ADD2E.LiteracyBasic",
      9: "ADD2E.Literate",
    };
    data.languages.literacy = Add2eActor._valueFromTable(
      literacy,
      data.scores.int.value
    );

    const spoken = {
      0: "ADD2E.NativeBroken",
      3: "ADD2E.Native",
      13: "ADD2E.NativePlus1",
      16: "ADD2E.NativePlus2",
      18: "ADD2E.NativePlus3",
    };
    data.languages.spoken = Add2eActor._valueFromTable(
      spoken,
      data.scores.int.value
    );
  }
}
