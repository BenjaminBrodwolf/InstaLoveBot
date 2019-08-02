const instaPuppet = require('./instagram');

(async () => {
    console.log("START Bot");

    await instaPuppet.openInstagram();

    await instaPuppet.login('brodwolfsky', 'trinacria');

    await instaPuppet.openByTagAndLike(['java', 'javascript', 'ES6'], 3);

    await instaPuppet.closeBrowser();


    console.log("Insta Bot ist fertig!")
})();
