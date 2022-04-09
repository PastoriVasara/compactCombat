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


class canvasButton extends CanvasLayer {
    actor;
    newButtons = {
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
                onClick: () => this._dialogRenderer(),
            }
        ]
    };
    constructor() {
        super();
    }

    _getActor() {
        this.player = game.user;
        let actorId = this.player.data.character;
        this.actor = game.actors.get(actorId);
    }

    populateActions(actions) {
        let members = [];
        
        for(let i = 0; i < actions.length; i++) {
            console.log(actions[i].item);
            let row = "<div>";
            console.log(actions[i].name);
            row += "<img src='" + actions[i].img + "' id='"+actions[i].item+"' width='36' height='36' onClick='rowClick(this)'>";
            row += "<span>" + actions[i].name + " | </span>";
            row += "<span>" + actions[i].actionCost + " | </span>";
            if(actions[i].damage != 'no damage')
            {
                row += "<span>" + actions[i].damage + " | </span>";
            }
            row[i].toHit == null ? null : row += "<span>" + actions[i].toHit + " | </span>";
            if(!actions[i].save == null)
            {
                row += "<span>" + actions[i].save.ability + " | </span>";
                row += "<span>" + actions[i].save.dc + "</span>";
            }

            row += "</div>";
            members.push({data: row});
        }
        return members;
    }

    
    async _dialogRenderer() {
        this.populateActions(getActions(this.actor.data.items));
        const templateData = { header: "Handlebars header text.",
            content: this.populateActions(getActions(this.actor.data.items))};
        const renderedContent = await renderTemplate("modules/compactCombat/templates/random.hbs", templateData);
        const dialog = new Dialog({
            title: "Uus Dialog",
            content: renderedContent,
            buttons: {
                toggle: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Okay",
                    callback: () => console.log(this.actor.items)
                }
            }
        });
        dialog.render(true);
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


let canbut = new canvasButton();

Hooks.on('ready', () => {
    canbut.initialize();
});
Hooks.on('getSceneControlButtons', controls => {
    controls.push(canbut.newButtons);
});




