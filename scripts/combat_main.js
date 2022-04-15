import {CCCombatTracker} from "./combat_tracker.js";
import {FILTER_DEFAULTS, MODULE_NAME, COMBAT_TRACKER_FLAG_NAME, FILTERS_FLAG_NAME, CONDITION_TYPES} from "./CONST.js";
import {objectsHaveSameKeys} from "./helpers.js";

let combatTracker = {};

class CcFormApplication extends FormApplication {
    constructor() {
        super();
        this.rollHookId = Hooks.on('Item5e.roll', this._onRoll.bind(this));
        this.updateItemHookId = Hooks.on('updateItem', this._onUpdateItem.bind(this));
        this.updateDataHook = Hooks.on('updateActor', this._onUpdateActorData.bind(this));
        this.updateCombat = Hooks.on('updateCombat', this._onUpdateCombat.bind(this));
        this.deleteCombat = Hooks.on('deleteCombat', this._onDeleteCombat.bind(this));
    }

    static get defaultOptions() {
        let options = {
            height: 720,
            width: 1000,
            resizable: true,
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
            classes: ["form", "dnd5e", "sheet", "actor", "character", "dndbcs"],
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
            popOut: true,
            template: `./modules/compactCombat/templates/ccTemplate.hbs`,
            id: 'cc-form-application',
            title: 'Compact Combat',
        };
        return mergeObject(super.defaultOptions, options);
    }

    getData() {
        var items = this._filterAndTransformItems(this.actor.data.items, this.actor);
        let actor = this._getActor();

        const proficiencyIcons = {
            0: "<i class='far fa-circle\'></i>",
            0.5: "<i class='fas fa-adjust'></i>",
            1: "<i class='fas fa-check'></i>",
            2: "<i class='fas fa-check-double'></i>"
        };
        let skills = actor.data.data.skills;
        //     .reduce((reducer, skill) => {
        //     return skill.icon = proficiencyIcons[skill.value];
        // });
        for (const key in skills) {skills[key].icon = proficiencyIcons[skills[key].value]}
        return {
            data: actor.data.data,
            abilities: actor.data.data.abilities,
            skills: actor.data.data.skills,
            flags: actor.data.flags.compactCombat,
            filters: actor.data.flags.compactCombat.filters,
            conditions: CONDITION_TYPES,
            items,
            proficiencyIcons
        }
    }

    _filterAndTransformItems(items) {
        let filters = this.actor.getFlag(MODULE_NAME, FILTERS_FLAG_NAME);
        let combatTrackerActions = this.actor.getFlag(MODULE_NAME, COMBAT_TRACKER_FLAG_NAME);

        let filteredItems = items.filter(item => {
            if (filters.prepared && (item.data.type === "spell" && item.data.data.level !== 0 && "preparation" in item.data.data && item.data.data.preparation.mode !== "always" && !item.data.data.preparation.prepared)) {
                return false;
            }
            if (filters.equipped && ("equipped" in item.data.data && item.data.data.equipped === false)) {
                return false;
            }
            if (filters.combatTracker) {
                if("activation" in item.data.data && item.data.data.activation.type in combatTrackerActions && combatTrackerActions[item.data.data.activation.type] < item.data.data.activation.cost ) {
                    return false;
                }
            }
            return (item.data.type === "consumable" || (item.data.data.activation && item.data.data.activation.type && item.data.data.activation.type))
        });


        //let filteredItems = items.filter(item => (item.data.data.equipped || (item.data.data.preparation && item.data.data.preparation.prepared) || item.data.type === "consumable") && (item.data.data.activation && item.data.data.activation.type && item.data.data.activation.type))
        let transformedItems = filteredItems.reduce((reducer, item) => {
            reducer[item.data.data.activation.type] = [...reducer[item.data.data.activation.type] || [], item];
            return reducer;
        }, {});
        return transformedItems
    }

    /**
     * Apply a certain amount of damage or healing to the health pool for Actor
     * @param {number} amount       An amount of damage (positive) or healing (negative) to sustain
     * @param {number} multiplier   A multiplier which allows for resistance, vulnerability, or healing
     * @returns {Promise<Actor5e>}  A Promise which resolves once the damage has been applied
     */
    async applyDamage(event) {
        event.preventDefault();
        let amount = 0;
        let multiplier = 1;
        if (event.currentTarget.id === "heal-button") {
            amount = -event.currentTarget.nextElementSibling.children[0].value
        }
        else if(event.currentTarget.id === "damage-button") {
            amount = event.currentTarget.previousElementSibling.children[0].value
        } else {
            return;
        }
        amount = Math.floor(parseInt(amount) * multiplier);
        const hp = this.actor.data.data.attributes.hp;

        // Deduct damage from temp HP first
        const tmp = parseInt(hp.temp) || 0;
        const dt = amount > 0 ? Math.min(tmp, amount) : 0;

        // Remaining goes to health
        const tmpMax = parseInt(hp.tempmax) || 0;
        const dh = Math.clamped(hp.value - (amount - dt), 0, hp.max + tmpMax);

        // Update the Actor
        const updates = {
            "data.attributes.hp.temp": tmp - dt,
            "data.attributes.hp.value": dh
        };

        // Delegate damage application to a hook
        // TODO replace this in the future with a better modifyTokenAttribute function in the core
        const allowed = Hooks.call("modifyTokenAttribute", {
            attribute: "attributes.hp",
            value: amount,
            isDelta: false,
            isBar: true
        }, updates);
        return allowed !== false ? this.actor.update(updates, {dhp: -amount}) : this.actor;
    }

    /* -------------------------------------------- */

    /**
     * Take a short rest, calling the relevant function on the Actor instance.
     * @param {Event} event             The triggering click event.
     * @returns {Promise<RestResult>}  Result of the rest action.
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /* -------------------------------------------- */

    /**
     * Take a long rest, calling the relevant function on the Actor instance.
     * @param {Event} event             The triggering click event.
     * @returns {Promise<RestResult>}  Result of the rest action.
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }

    async _addAction(event) {
        event.preventDefault();
        await this.combatTracker.increaseValue("action");
        this._onSubmit(event);
    }

    async _updateData(data, actor) {
        let expanded = expandObject(data);
        await this.combatTracker.updateData(expanded.flags.combatTracker);
        await actor.setFlag(MODULE_NAME, FILTERS_FLAG_NAME, expanded.filters);
        this.actor = actor;
    }


    async _updateObject(event, formData) {
        if(event && "currentTarget" in event && "id" in event.currentTarget && event.currentTarget.id === "heal-damage-input") {
            return;
        }
        this.actor = await this._getActor();
        if (formData) {
            await this._updateData(formData, this.actor);
        }
        this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".short-rest").click(this._onShortRest.bind(this));
        html.find(".long-rest").click(this._onLongRest.bind(this));
        html.find(".add-action").click(this._addAction.bind(this));
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
        html.find(".rollable.item-roll").click(event => this._onItemRoll(event));
        html.find(".ability-name").click(this._onRollAbilityTest.bind(this));
        html.find(".skill-name").click(this._onRollSkillCheck.bind(this));
        html.find("#heal-button").click(this.applyDamage.bind(this));
        html.find("#damage-button").click(this.applyDamage.bind(this));
        super.activateListeners(html);
    }

    _getActor() {
        this.player = game.user;
        let actorId = this.player.data.character;
        let actor = game.actors.get(actorId);
        let filters = actor.getFlag(MODULE_NAME, FILTERS_FLAG_NAME);
        if (!filters) {
            actor.setFlag(MODULE_NAME, FILTERS_FLAG_NAME, FILTER_DEFAULTS);
            return actor;
        }
        if (!objectsHaveSameKeys(filters, FILTER_DEFAULTS)) {
            actor.setFlag(MODULE_NAME, FILTERS_FLAG_NAME, FILTER_DEFAULTS);
            return actor;
        }
        return actor;
    }

    async _onRoll(item, message) {
        if (message.user !== game.user.data._id) {
            return;
        }
        if (item.data.data.activation && item.data.data.activation.type && item.data.data.activation.cost > 0) {
            if (game.combat) {
                await this.combatTracker.decreaseValue(item.data.data.activation.type, item.data.data.activation.cost);
            }
            this._updateObject();
        }
    }

    _onUpdateItem(item) {
        this._updateObject();
    }
    _onUpdateActorData(data) {
        this._updateObject();
    }

    async _onUpdateCombat(combat) {
        let actorId = game.user.data.character;
        let combatant = combat.getCombatantByActor(actorId);
        if(combat.current.combatantId === combatant.id) {
            await this.combatTracker.resetActions();
            this._updateObject();
        }
    }

    async _onDeleteCombat() {
        await this.combatTracker.resetActions();
        this._updateObject();
    }

    /* -------------------------------------------- */

    /**
     * Handle mouse click events for character sheet actions.
     * @param {MouseEvent} event  The originating click event.
     * @returns {Promise}         Dialog or roll result.
     * @private
     */
    _onSheetAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        switch ( button.dataset.action ) {
            case "rollDeathSave":
                return this.actor.rollDeathSave({event: event});
            case "rollInitiative":
                return this.actor.rollInitiative({createCombatants: true});
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle rolling an item from the Actor sheet, obtaining the Item instance, and dispatching to its roll method.
     * @param {Event} event  The triggering click event.
     * @returns {Promise}    Results of the roll.
     * @private
     */
    _onItemRoll(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.itemId;

        const item = this.actor.items.get(itemId);
        if ( item ) return item.roll();
    }

    /**
     * Handle rolling an Ability test or saving throw.
     * @param {Event} event      The originating click event.
     * @private
     */
    _onRollAbilityTest(event) {
        event.preventDefault();
        let ability = event.currentTarget.parentElement.dataset.ability;
        this.actor.rollAbility(ability, {event: event});
    }

    /* -------------------------------------------- */

    /**
     * Handle rolling a Skill check.
     * @param {Event} event      The originating click event.
     * @returns {Promise<Roll>}  The resulting roll.
     * @private
     */
    _onRollSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.closest("[data-skill]").dataset.skill;
        return this.actor.rollSkill(skill, {event: event});
    }

    async initialize() {
        this.actor = this._getActor();
        this.combatTracker = new CCCombatTracker(this.actor);
        await this.combatTracker.initialize();
        this._updateObject();
    }

}

function getButtons() {
    return {
        activeTool: "CombatHelper",
        name: "combat",
        icon: "fas fa-receipt",
        layer: "grid",
        title: "Combat Helper",
        tools: [
            {
                icon: "fas fa-bong",
                name: "CombatHelperDialog",
                title: "Open combat helper",
                onClick: () => window.CcFormApplication.initialize(),
            }
        ]
    };
}


window.CcFormApplication = new CcFormApplication();
Hooks.on('getSceneControlButtons', controls => {
    controls.push(getButtons());
});


