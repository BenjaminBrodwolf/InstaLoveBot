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
let blocked = false;
let waitingMessage = "Bot Loggt sich ein";


const instagram = {
    browser: null,
    page: null,


    openInstagram: async () => {
        console.log("initialize")
        instagram.browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            headless: headlessModus,
            args: ['--no-sandbox', '--lang=de-DE'],
        });


        instagram.page = await instagram.browser.newPage();

        await instagram.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
        await instagram.page.setViewport({width: 960, height: 768});

        await instagram.page.goto(BASEL_URL, {timeout: 60000});
        await instagram.page.waitFor(2500);
    },

    login: async (username, password) => {
        console.log("LOGIN");
        botsMessages(waitingMessage);

        // await instagram.page.screenshot({path: './screenshot/login.jpg', type: 'jpeg'});

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
        // await instagram.page.screenshot({path: './screenshot/loggedIN.jpg', type: 'jpeg'});

        let notNowClick = await instagram.page.$x('//button[contains(text(), "Jetzt nicht")]');
        if (notNowClick.length > 0) await notNowClick[0].click();

    },

    openByTagAndLike: async (tagList, amount, username) => {
        console.log("OPEN BY TAG");
        botsMessages("Schaue nach Hashtag-Posts");

        let waitingTime = 0;
        let postURL;

        for (let tag of tagList) {

            await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
            await instagram.page.waitFor(1000);

            // await instagram.page.screenshot({path: './screenshot/openByTag.jpg', type: 'jpeg'});

            let posts = await instagram.page.$$('article > div:nth-child(3) img[decoding="auto"]');
            await posts[0].click(); // click auf ersten Post
            await instagram.page.waitFor(1000);


            for (let i = 0; i < amount / tagList.length; i++) {
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
                botsMessages("Post gefunden");

                await instagram.page.waitFor(1000);


                postURL = await instagram.page.url();

                console.log("Watching Post with Tag: <" + tag + "> Nr." + (i + 1) + " of " + amount);
                console.log(postURL);


                let isLikeable = await instagram.page.$('span.glyphsSpriteHeart__outline__24__grey_9[aria-label="Gefällt mir"]'); //('span[aria-label="Gefällt mir"]');

                if (isLikeable) {
                    console.log("LIKE");
                    botsMessages("Post wird gelikt ♥ ");
                    await instagram.page.click('span.fr66n > button');//click the like button

                    await instagram.page.waitFor(1500); //short waiting time

                    let blocking = await instagram.page.$('div.RnEpo'); // blocking message
                    if (blocking) {
                        blocked = true;
                        return;
                    }

                    updateView('liked', ++liked);

                    // div.kPFhm > div.KL4Bh > img    // foto einzel
                    const singlePic = 'div.kPFhm > div.KL4Bh > img'; // .src
                    const manyPics = 'div.eLAPa > div.KL4Bh > img'; // .src
                    const videoPic = 'div.GRtmf.wymO0 > div > video'; // .poster

                    let newPic = "";
                    if (await instagram.page.$(singlePic)) {
                        console.log("singlePic")
                        newPic = await instagram.page.$eval(singlePic, el => el.src);
                    } else if (await instagram.page.$$(manyPics)) {
                        console.log("firstPic")
                        // const amountPics = await instagram.page.$$(manyPics).length;
                        newPic = await instagram.page.$$eval(manyPics, el => el[el.length - 2].src);
                    } else if (await instagram.page.$(videoPic)) {
                        console.log("VideoPic")
                        newPic = await instagram.page.$eval(videoPic, el => el.poster);
                    } else {
                        console.log("KEIN PIC GEFUNDEN!!!")
                    }
                    console.log(newPic);

                    const userName = await instagram.page.$eval('div.e1e1d > h2 > a', el => el.text);
                    const userPic = await instagram.page.$eval('img._6q-tv', el => el.src);
                    const userComment = await instagram.page.$eval('div.C4VMK > span', el => el.innerHTML);
                    const follow = await instagram.page.$('div.bY2yH > button', btn => btn.textContent);

                    addNewPost(newPic, userName, userPic, userComment, postURL);
                    // await like(postURL, tag, username)
                    //     .catch(e => console.log(" <<< FIREBASE ERROR >>>" + e.message));


                    waitingTime = 26000 + Math.floor(Math.random() * 6000);  // wait for 20 sec plus random amount of time.

                    await instagram.page.waitFor(1500); //short waiting time fot the BotMessage-Showtime
                    waitingTime -= 1500;
                    waitingMessage = "Öffne nächsten Post in ";

                } else {
                    console.log("ALREADY LIKED");

                    i--;
                    waitingTime = 1500 + Math.floor(Math.random() * 6000);
                    waitingMessage = "Bereits gelikt. Öffne nächsten Post in ";
                }

                if (i + 1 === amount) {
                    console.log("FINISHED");
                    return;
                }




                botsMessages(waitingMessage, millisToSecond(waitingTime));

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
        if (blocked) {
            botsMessages("Die Handlungen werden von Instagram blockiert. Bot wird abbgebrochen. Zeit für eine Pause. Bitte versuche es später noch einmal.", -1);
        } else {
            botsMessages("Fertig.", -1);
        }

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


/* ------------- START ----------- */

(async () => {
    console.log(" process.type: ", process.type)

    const data = await getUrlVars();

    headlessModus = !data.headless;
    console.log("headlessModus: ", headlessModus);

    const hashTags = data.tags.replace("%2C+", ":::").replace("%2C", ":::").split(":::");  // AAA, BBB,CCC = AAA%2C+BBB%2CCCC

    login = data.login;
    tags = hashTags;
    amount = data.amount;
    console.log(data.remember)

    // document.getElementById('name').innerText = login;
    // document.getElementById('tags').innerText = tags

    // updateView('name', login);
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


/* ---- UTILITIES ---- */

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

function addNewPost(picPath, userName, userPic, userComment, postURL) {

    const postField = document.getElementById("newLikedPosts");

    postField.insertAdjacentHTML('afterbegin', `
    <div class="post">
        <div class="photo">
            <img src="${picPath}" onclick="openURL('${postURL}')" style="cursor: pointer"/>
        </div>

        <div class="card_inside">

            <div class="author">
                <img src="${userPic}" alt="user" onclick="openURL('https://www.instagram.com/${userName}')" style="cursor: pointer">
                <div class="author_name" >
                    <h4 onclick="openURL('https://www.instagram.com/${userName}')" style="cursor: pointer">${userName}</h4>
                </div>
            </div>

            <div class="comment">
              ${userComment}
              </div>
        </div>
    </div>
    `);

    setTimeout(() => { //wait a little to be sure, the image and everything is loaded on the HTML-Body
        const postInfo = document.getElementsByClassName('post')[0];

        const postHeight = postInfo.clientHeight;
        const imageHeight = document.getElementsByClassName('photo')[0].clientHeight;
        const commentHeight = postInfo.lastElementChild.lastElementChild.clientHeight; //document.getElementsByClassName('comment')[0].clientHeight + 7;

        let y = postHeight - (commentHeight + 100 + imageHeight);

        // console.log("commentHeight ", commentHeight);
        // console.log("imgHeigth", imageHeight);
        // console.log("postHeigth ", postHeight);
        // console.log("y ", y);

        if (y < 0) {
            y = y * -1;
        }
        if (y > imageHeight) {
            y = imageHeight;
        }

        let cardDiv = document.getElementsByClassName('card_inside')[0];
        cardDiv.setAttribute("onMouseOver", `this.style.transform='translateY(-${y}px)'`);
        cardDiv.setAttribute("onMouseOut", "this.style.transform='translateY(0)'");
    }, 1500);


}


