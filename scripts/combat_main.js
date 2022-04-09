function rowClick(event) 
{
    console.log("Hello");
    let player = game.user;
    let actorId = player.data.character;
    let actor = game.actors.get(actorId);
    console.log(event);
    actor.items.get(event.id).roll();

    console.log(actor);
}

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
        return {
            header: "Header",
            content: getActions(this.actor.data.items)
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
function getActions(items)
{
    console.log(items);
    var actionList = [];
    for (const [key,value] of items.entries())
    {
        console.log(key);
        var item_info = value.data;
        var item_details = item_info.data;
        if (item_details.actionType == null || item_details.actionType == 'other' || item_details.actionType == ''){
            continue;
        }
  
        var damage_parts = item_details.damage.parts;
        var damage_print = '';
        for( var i = 0; i < damage_parts.length; i++){

            damage_print += damage_parts[i][0].split('[')[0];
        }
 
        if (item_details.damage.versatile != '')
        {
            damage_print += "  /  "  +item_details.damage.versatile.split('[')[0];
        }
        damage_print == '' ? damage_print = 'no damage' : damage_print;
     
        actionList.push( 
        {
            'name': item_info.name,
            'img': item_info.img,
            'actionCost' : item_details.activation.type,
            'actionType': item_details.actionType,
            'damage': damage_print,
            'toHit': 'toHit' in value.labels ? value.labels.toHit : null,
            'save': item_details.save.dc == null ? null : { 
                'ability': item_details.save.ability,
                'dc': item_details.save.dc,
            
            },
            'item': key
        });
        console.log(value);
    }
    return actionList;
}

function getButtons(form) {
    console.log("Form", form);
    return newButtons = {
        activeTool: "DrawSquare",
        name: "grid",
        icon: "fas fa-wrench",
        layer: "grid",
        title: "Grid Controls",
        tools: [
            {
                icon: "fas fas fa-square",
                name: "DrawSquare",
                title: "Configure the grid by drawing a square",
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




