import {objectsHaveSameKeys} from "./helpers.js";
import {COMBAT_TRACKER_FLAG_NAME, DEFAULT_COMBAT_TRACKER, MODULE_NAME} from "./CONST.js";

export class CCCombatTracker {

    combatTracker = {};
    actor;

    constructor(actor) {
        this.actor = actor;
    }

    async initialize() {
        if(!this.actor.getFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME) || !objectsHaveSameKeys(this.actor.getFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME), DEFAULT_COMBAT_TRACKER)) {
            this.combatTracker = DEFAULT_COMBAT_TRACKER;
            await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
        } else{
            this.combatTracker = this.actor.getFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME);
        }
    }

    async resetActions() {
        this.combatTracker = {...this.combatTracker, action: this.combatTracker.maxActions, reaction: this.combatTracker.maxReactions, bonus: this.combatTracker.maxBonus};
        await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
    }

    async increaseValue(key, amount = 1) {
        this.combatTracker[key] = this.combatTracker[key] + amount;
        await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
    }

    async decreaseValue(key, amount = 1) {
        this.combatTracker[key] = this.combatTracker[key] - amount < 0 ? 0 : this.combatTracker[key] - amount;
        await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
    }

    async setValue(key, value) {
        this.combatTracker[key] = value < 0 ? 0 : value;
        await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
    }

    async updateData(data) {
        this.combatTracker = data;
        await this.actor.setFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, this.combatTracker);
    }

}
