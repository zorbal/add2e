import { Add2ePartySheet } from "./dialog/party-sheet.js";

export const addControl = (object, html) => {
    let control = `<button class='add2e-party-sheet' type="button" title='${game.i18n.localize('ADD2E.dialog.partysheet')}'><i class='fas fa-users'></i></button>`;
    html.find(".fas.fa-search").replaceWith($(control))
    html.find('.add2e-party-sheet').click(ev => {
        showPartySheet(object);
    })
}

export const showPartySheet = (object) => {
    event.preventDefault();
    new Add2ePartySheet(object, {
      top: window.screen.height / 2 - 180,
      left:window.screen.width / 2 - 140,
    }).render(true);
}

export const update = (actor, data) => {
    if (actor.getFlag('add2e', 'party')) {
        Object.values(ui.windows).forEach(w => {
            if (w instanceof Add2ePartySheet) {
                w.render(true);
            }
        })
    }
}