const puppeteer = require('puppeteer');

const BASEL_URL = 'https://www.instagram.com/';

const instagram = {
    browser: null,
    page: null,
    hashtag: null,

    openInstagram: async () => {
        console.log("initialize")
        instagram.browser = await puppeteer.launch({
            headless: false
        });

        instagram.page = await instagram.browser.newPage();

        await instagram.page.goto(BASEL_URL, {waitUntil: 'networkidle2'});
    },

    login: async (username, password) => {

        let loginButton = await instagram.page.$x('//a[contains(text(), "Melde dich an.")]');

        // await console.log(loginButton[0]);

        /* Klicke Login */
        await loginButton[0].click();

        await instagram.page.waitFor(1000);

        /* Eingabe Username und Password */
        await instagram.page.type('input[name=username]', username, {delay: 50});
        await instagram.page.type('input[name=password]', password, {delay: 50});

        /*Klicke anmelden*/
        loginButton = await instagram.page.$x('//div[contains(text(), "Anmelden")]');
        await loginButton[0].click();

        await instagram.page.waitFor(2000);


        let notNowClick;
        while (notNowClick === undefined || notNowClick.length === 0) {
                notNowClick = await instagram.page.$x('//button[contains(text(), "Jetzt nicht")]');
        }
        await notNowClick[0].click();
    }


};

module.exports = instagram;
