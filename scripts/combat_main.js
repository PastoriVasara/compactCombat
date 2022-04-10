import {getAbilities,getActions} from './character_stats.js';

class CcFormApplication extends FormApplication {
    constructor(exampleOption) {
        super();
        this.exampleOption = exampleOption;
    }

    static get defaultOptions() {
        let options = {
            height: 720,
            width: 800,
            resizable: true,
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
            classes: ['form'],
            popOut: true,
            template: `./modules/compactCombat/templates/ccTemplate.html`,
            id: 'cc-form-application',
            title: 'Compact Combat',
        };
        console.log("options", super.defaultOptions, options);
        return mergeObject(super.defaultOptions, options);
    }

    getData() {
        console.log('? data ?');
        var abilities = getAbilities(this.actor);
        var actions = getActions(this.actor.data.items);
        console.log(abilities);
        console.log(actions);
        return {
            header: "Header",
            content: {'abilities' : abilities, 'actions' : actions}
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    asznc__updateObject(event, formData) {
        console.log(formData.exampleInput)
    }

    _getActor() {
        this.player = game.user;
        let actorId = this.player.data.character;
        this.actor = game.actors.get(actorId);
    }


    initialize() {
        this._getActor();
    }
    
}

function getButtons(form) {
    console.log("Form", form);
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
                onClick: () => form.render(true),
            }
        ]
    };
}

Hooks.on('getSceneControlButtons', controls => {
    window.CcFormApplication = CcFormApplication;
    let newccFormApplication = new CcFormApplication("example");
    newccFormApplication.initialize();
    controls.push(getButtons(newccFormApplication));
    newccFormApplication.render()
});




