const puppeteer = require('puppeteer');

const BASEL_URL = 'https://www.instagram.com/';

const TAG_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;

const firebase_db = require('./db');
const puppeteerConfig = require('./config/puppeteer.json');


const instagram = {
    browser: null,
    page: null,
    hashtag: null,


    openInstagram: async () => {
        console.log("initialize")
        instagram.browser = await puppeteer.launch({
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

    openByTagAndLike: async (tagList, amount) => {

        for (let tag of tagList) {

            await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
            await instagram.page.waitFor(1000);

            let posts = await instagram.page.$$('article > div:nth-child(3) img[decoding="auto"]');

            for (let i = 0; i < amount; i++) {

                let post = posts[i];
                //console.log(post)

                await post.click();

                /* Warte bis Post geladen */
                await instagram.page.waitFor('span[id="react-root"][aria-hidden="true"]');
                await instagram.page.waitFor(1000);
                console.log("Watched Post Nr." + i + " of " + amount)


                let isLikeable = await instagram.page.$(puppeteerConfig.selectors.post_heart_grey); //('span[aria-label="Gefällt mir"]');

                if (isLikeable) {
                    console.log("LIKED")
                    await instagram.page.click(puppeteerConfig.selectors.post_like_button);//click the like button

                    let likedPostURL = await instagram.page.url(); //.$('a.c-Yi7')

                    await firebase_db.like(likedPostURL, tag)
                        .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message))

                    await instagram.page.waitFor(10000 + Math.floor(Math.random() * 500));// wait for random amount of time.
                }


                //Closing the current post modal
                await instagram.page.click(puppeteerConfig.selectors.post_close_button)
                    .catch((e) => console.log('<<< ERROR CLOSING POST >>> ' + e.message));
                //Wait for random amount of time
                await instagram.page.waitFor(2250 + Math.floor(Math.random() * 250));

            }
        }
    },

    closeBrowser: async () => {
        console.log("Program end! Browser get closed.");

        await instagram.browser.close();

    }
};

module.exports = instagram;
