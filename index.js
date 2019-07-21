const instaPuppet = require('./instagram');


(async () => {

    await instaPuppet.openInstagram();

    await instaPuppet.login('brodwolfsky', 'trinacria');

    debugger;

})();
