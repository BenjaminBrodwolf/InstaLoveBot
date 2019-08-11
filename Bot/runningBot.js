const Store = require('electron-store');
const store = new Store();

const puppeteer = require('puppeteer-core');
const BASEL_URL = 'https://www.instagram.com/';
const TAG_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;

let headlessModus = true;
let login;
let tags;
let amount;
let liked = 0;

const instagram = {
    browser: null,
    page: null,


    openInstagram: async () => {
        console.log("initialize")
        instagram.browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            headless: headlessModus,
            args: ['--no-sandbox', '--lang=de-DE']
        });

        instagram.page = await instagram.browser.newPage();

        await instagram.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
        await instagram.page.setViewport({width: 960, height: 768});

        await instagram.page.goto(BASEL_URL, {timeout: 60000});
        await instagram.page.waitFor(2500);
    },

    login: async (username, password) => {
        console.log("LOGIN")
        await instagram.page.screenshot({path: './screenshot/login.jpg', type: 'jpeg'});

        await instagram.page.waitForXPath('//a[contains(text(), "Melde dich an.")]');
        let loginButton = await instagram.page.$x('//a[contains(text(), "Melde dich an.")]');

        /* Klicke Login */
        await loginButton[0].click();

        await instagram.page.waitFor(2000);

        /* Eingabe Username und Password */
        await instagram.page.type('input[name=username]', username, {delay: 50});
        await instagram.page.type('input[name=password]', password, {delay: 50});

        /*Klicke anmelden*/
        loginButton = await instagram.page.$x('//div[contains(text(), "Anmelden")]');
        await loginButton[0].click();

        await instagram.page.waitForNavigation();
        await instagram.page.screenshot({path: './screenshot/loggedIN.jpg', type: 'jpeg'});

        let notNowClick = await instagram.page.$x('//button[contains(text(), "Jetzt nicht")]');
        if (notNowClick.length > 0) await notNowClick[0].click();

    },

    openByTagAndLike: async (tagList, amount, username) => {
        console.log("OPEN BY TAG");

        let waitingTime = 0;
        let postURL;

        for (let tag of tagList) {

            await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
            await instagram.page.waitFor(1000);

            await instagram.page.screenshot({path: './screenshot/openByTag.jpg', type: 'jpeg'});

            let posts = await instagram.page.$$('article > div:nth-child(3) img[decoding="auto"]');
            await posts[0].click(); // click auf ersten Post
            await instagram.page.waitFor(1000);


            for (let i = 0; i < amount; i++) {
                const URL = await instagram.page.url(); //.$('a.c-Yi7')
                if (!URL.toString().startsWith("https://www.instagram.com/explore/tags/")) {
                    postURL = URL;
                }


                /* Warte bis Post geladen */
                await instagram.page.waitFor('span[id="react-root"][aria-hidden="true"]')
                    .catch(async e => {
                        console.log('<<< ERROR OPENING POST >>> ' + e.message);
                        // await logError(e.message, tag, username)
                        //     .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));

                        await openLastPost(postURL, TAG_URL(tag), i);
                        await nextPost.click();

                    });
                await instagram.page.waitFor(1000);
                console.log("Watching Post with Tag: <" + tag + "> Nr." + (i + 1) + " of " + amount)
                console.log(postURL);


                let isLikeable = await instagram.page.$('span.glyphsSpriteHeart__outline__24__grey_9[aria-label="Gefällt mir"]'); //('span[aria-label="Gefällt mir"]');

                if (isLikeable) {
                    console.log("LIKE");
                    await instagram.page.click('span.fr66n > button');//click the like button

                    let picNr = i % 20;
                    await instagram.page.screenshot({
                        path: `./screenshot/liked/${picNr}.jpg`,
                        type: 'jpeg',
                        clip: {x: 70, y: 200, width: 480, height: 380}
                    });


                    updateView('liked', ++liked);
                    addTablePost(`../screenshot/liked/${picNr}.jpg`, "Benjj");
                    // await like(postURL, tag, username)
                    //     .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));

                    waitingTime = 20000 + Math.floor(Math.random() * 6000);  // wait for 20 sec plus random amount of time.

                } else {
                    console.log("ALREADY LIKED");
                    i--;
                    waitingTime = 1000 + Math.floor(Math.random() * 6000);
                }


                console.log("BOT is waiting " + millisToSecond(waitingTime) + " second before next action.");
                await instagram.page.waitFor(waitingTime);

                /* Selektieren des PAGINATION-ARROW-NEXT */
                let nextPost = await instagram.page.$('a.coreSpriteRightPaginationArrow'); //posts[i];

                try {
                    await nextPost.click();
                } catch (e) {
                    console.log('<<< ERROR OPEN NEXT POST >>> ' + e.message);
                    // await logError(e.message, tag, username)
                    //     .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));

                    await openLastPost(postURL, TAG_URL(tag), tag);

                    nextPost = await instagram.page.$('a.coreSpriteRightPaginationArrow'); //posts[i];
                    await nextPost.click();
                }

            }
        }
    },

    closeBrowser: async () => {
        console.log("Browser get closed.");

        await instagram.browser.close();

    }
};


const millisToSecond = millis => ((millis % 60000) / 1000).toFixed(0);

const openLastPost = async (postURL, tagURL, tag) => {

    console.log("TRY RE-OPEN LAST POST");
    await instagram.page.goto(tagURL, {waitUntil: 'networkidle2'});
    const postID = postURL.replace('https://www.instagram.com', '');
    await findPosts(postID, tag);
}

const findPosts = async (postID, tag) => {
    let searchingIteration = 0;

    console.log("Searching for post-ID: " + postID);

    const post_xpath_selector = `//a[contains(@href, '${postID}')]`;

    // while not found scroll down. After 20-times stop
    while (undefined === (await instagram.page.$x(post_xpath_selector))[0] && searchingIteration < 20) {
        console.log("Searching.... " + searchingIteration + " / 20");

        await instagram.page.evaluate(async () => {
            let distance = 600;
            console.log(document.body.scrollHeight)
            window.scrollBy(0, distance);
        });
        // waitFor render
        await instagram.page.waitFor(1100);
        searchingIteration++;
    }


    try {
        const foundedPost = (await instagram.page.$x(post_xpath_selector))[0];
        await foundedPost.click();

    } catch (e) {
        console.log("POST NOT FOUND");
        console.log("- START FROM BEGINNING -");

        await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
        await instagram.page.waitFor(1000);

        let posts = await instagram.page.$$('article > div:nth-child(3) img[decoding="auto"]');
        await posts[0].click(); // click auf ersten Post
        await instagram.page.waitFor(1000);
    }


};


(async () => {

    const data = await getUrlVars();
    console.log(data.headless);
    headlessModus = !data.headless;

    const hashTags = data.tags.replace("%2C+", ":::").replace("%2C", ":::").split(":::");  // AAA, BBB,CCC = AAA%2C+BBB%2CCCC

    login = data.login;
    tags = hashTags;
    amount = data.amount;
    console.log(data.remember)

    // document.getElementById('name').innerText = login;
    // document.getElementById('tags').innerText = tags

    updateView('name', login);
    updateView('tags', tags)
    updateView('liked', liked)
    updateView('amount', amount)


    if (data.remember) {
        store.set('remember', 'ON');
        store.set('login', login);
        store.set('pw', data.password);

    } else {
        store.set('remember', 'OFF');
        store.set('login', '');
        store.set('pw', '');
    }


    // STARTING THE INSTAGRAM LIKE BOT PUPPETEER

    await instagram.openInstagram();

    await instagram.login(data.login, data.password);

    await instagram.openByTagAndLike(tags, Number(data.amount));

    await instagram.closeBrowser();

    console.log("Insta Bot ist fertig!")
})();

function getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

const updateView = (elementID, value) => {
    document.getElementById(elementID).innerText = value;
};

function addTablePost(picPath, postUser) {
    console.log(picPath)
    // get the html table
    // 0 = the first table
    let table = document.getElementsByTagName('table')[0];

    // add new empty row to the table
    // 0 = in the top
    // table.rows.length = the end
    // table.rows.length/2+1 = the center
    let newRow = table.insertRow(1);

    // add cells to the row
    let cel1 = newRow.insertCell(0);
    let cel2 = newRow.insertCell(1);
    let cel3 = newRow.insertCell(2);

    // add values to the cells
    cel1.innerHTML = liked.toString();
    cel2.innerHTML = `<img src="${picPath}"/>`;
    cel3.innerHTML = postUser;

}
