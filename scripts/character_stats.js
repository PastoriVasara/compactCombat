export function getAbilities(actor)
{
    var actor_data =actor.data.data;
    console.log(actor.data);
    var abilities = {
        'abilities' : [],
        'skills' : []
    };
    for (const [key,value] of Object.entries(actor_data.abilities))
    {
        abilities['abilities'].push(
            {
                'name': key,
                'value': value,
                'mod': value.mod,
                'save': value.proficient == '1' ? true : false,
            }
            );

    }
    for (const [key,value] of Object.entries(actor_data.skills))
    {
        abilities['skills'].push(
            {
                'name': value.label,
                'base': value.passive,
                'mod' : value.mod,
                'baseProficiency': value.prof._baseProficiency,
                'proficiency': value.prof.multiplier
            }
        );
    }
    abilities['ac'] = actor_data.attributes.ac.value;
    abilities['hp'] = 
    {
        'max': actor_data.attributes.hp.max,
        'current': actor_data.attributes.hp.value,
        'temp': actor_data.attributes.hp.temp,
        'tempmax': actor_data.attributes.hp.tempmax
    }
    abilities['hitdice'] = actor_data.attributes.hd;
    abilities['prof'] = actor_data.attributes.prof;
    abilities['move'] = actor_data.attributes.movement.walk;
    console.log('abilities through?');
    return abilities;
}

export function getActions(items)
{
    var actionList = {};
    for (const [key,value] of items.entries())
    {
        var item_info = value.data;
        var item_details = item_info.data;
        if (item_details.activation == null || item_details.activation.type == 'other' || item_details.activation.type == ''){
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
        damage_print == '' ? damage_print = false : damage_print;
        if (!(item_details.activation.type in actionList))
        {
            actionList[item_details.activation.type] = [];
        }
        actionList[item_details.activation.type].push( 
        {
            'name': item_info.name,
            'img': item_info.img,
            'actionCost' : item_details.activation.type,
            'actionType': item_details.actionType,
            'damage': damage_print,
            'toHit': 'toHit' in value.labels ? value.labels.toHit : null,
            'save': item_details.save.dc == null ? item_details.save.dc == false : { 
                'ability': item_details.save.ability,
                'dc': item_details.save.dc,
            
            },
            'item': key
        });
    }
    console.log(actionList);
    return actionList;
}