const puppeteer = require('puppeteer');

const BASEL_URL = 'https://www.instagram.com/';

const TAG_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;

const firebase_db = require('./db');
const puppeteerConfig = require('./config/puppeteer.json');


const instagram = {
    browser: null,
    page: null,


    openInstagram: async () => {
        console.log("initialize")
        instagram.browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            headless: false,
            args: ['--no-sandbox']
        });

        instagram.page = await instagram.browser.newPage();
        // instagram.page.setViewport({width: 1500, height: 764});


        await instagram.page.goto(BASEL_URL, {timeout: 60000});
        await instagram.page.waitFor(2500);
    },

    login: async (username, password) => {

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

        let notNowClick = await instagram.page.$x('//button[contains(text(), "Jetzt nicht")]');
        await notNowClick[0].click();

        /*
        await instagram.page.waitFor(2000);
        let notNowClick;
        while (notNowClick === undefined || notNowClick.length === 0) {
                notNowClick = await instagram.page.$x('//button[contains(text(), "Jetzt nicht")]');
        }
        await notNowClick[0].click();

         */
    },

    openByTagAndLike: async (tagList, amount, username) => {
        let waitingTime = 0;
        let postURL;

        for (let tag of tagList) {

            await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
            await instagram.page.waitFor(1000);

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
                        await firebase_db.logError(e.message, tag, username)
                            .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));
                    });
                await instagram.page.waitFor(1000);
                console.log("Watching Post with Tag: <" + tag + "> Nr." + (i + 1) + " of " + amount)
                console.log(postURL);


                let isLikeable = await instagram.page.$('span.glyphsSpriteHeart__outline__24__grey_9[aria-label="Gefällt mir"]'); //('span[aria-label="Gefällt mir"]');

                if (isLikeable) {
                    console.log("LIKE");
                    await instagram.page.click(puppeteerConfig.selectors.post_like_button);//click the like button

                    await firebase_db.like(postURL, tag, username)
                        .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));

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
                    await firebase_db.logError(e.message, tag, username)
                        .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));
                    console.log("TRY RE-OPEN LAST POST");

                    await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});

                    const postID = postURL.replace('https://www.instagram.com', '');
                    await findPosts(postID, i)
                }


                //Closing the current post modal
                // await instagram.page.click(puppeteerConfig.selectors.post_close_button)
                //     .catch((e) => console.log('<<< ERROR CLOSING POST >>> ' + e.message));
                //Wait for random amount of time

            }
        }
    },

    closeBrowser: async () => {
        console.log("Browser get closed.");

        await instagram.browser.close();

    }
};


module.exports = instagram;

const millisToSecond = millis => ((millis % 60000) / 1000).toFixed(0);


const findPosts = async (postID, numberOfPosts) => {
    let foundPost;
    let iteration = 0;

    // while (!foundPost) {
    //
    //     if (numberOfPosts > 36) {
    //         await scrollPageDown();
    //         // waitFor render
    //         await instagram.page.waitFor(1500);
    //     }
    //
    //     // search for Post with specifig URL
    //     console.log("Searching for post-ID: " + postID);
    //
    //     // let loginButton = await instagram.page.$x('//a[contains(text(), "Melde dich an.")]');
    //
    //
    //     iteration++;
    //     if (iteration > 10) {
    //         console.log("Post not found! Bot will restart.")
    //     }
    // }

    console.log("Searching for post-ID: " + postID);
    foundPost = await instagram.page.$x(`//a[contains(@href, '${postID}')]`); // $x("a[contains(@href,'/p/B0y7U60gf8g/')]")[0]
    console.log(foundPost[0]);
    console.log(foundPost);

    try {
        await foundPost[0].click();

    } catch (e) {
        console.log("FOUNDPOST CLICK ERROR " + e.message)
    }
};

const scrollPageDown = async () => {
    window.scrollTo(0, getDocumentDimensions().height);
    await instagram.page.waitFor(1000);
};

const getDocumentDimensions = () => {
    const height = Math.max(
        document.documentElement.clientHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
    );

    const width = Math.max(
        document.documentElement.clientWidth,
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
    );

    return {
        height,
        width,
    };
};
