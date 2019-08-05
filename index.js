const express = require("express");
let app = express();
const http = require('http');
const server = http.createServer(app);

const puppeteer = require('puppeteer');
const instaPuppet = require('./Bot/instagram');

const bodyParser = require('body-parser')
// create application/json parser
const jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })

// app.use(express.body)
app.use(express.static('Bot'));

//make way for some custom css, js and images
app.use('/css', express.static(__dirname + '/Bot/css'));
app.use('/js', express.static(__dirname + '/Bot/js'));


let port;
server.listen(8081, function(){
    port = server.address().port;
    console.log("Server started at http://localhost:%s", port);
});

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        headless: false
    })
    const page = await browser.newPage()
    // await page.setViewport({ width: 1366, height: 768});

    await page.goto("http://localhost:" + port, {
        waitUntil: 'networkidle2'
    });

})();


app.post('/submit', urlencodedParser , (req, res) => {
    // console.log("submit clicked")
    // console.log(req.body);
    let tags = req.body.tags.split(",");
    tags = tags.map(e => e.replace(/\s/g, ""));
    console.log(tags);

    startTheBot(req.body.login, req.body.password, tags, req.body.amount).then(() => {
        console.log("OUT!")
    });
    res.send('Hallo, ' + req.body.login + " \n dein Instagram-Bot ist jetzt gestartet! \n Die Posts unter den Tag(s): " + tags + " werden nun jeweils " + req.body.amount + "-mal geliket.")

});


async function startTheBot(login, pw, tags, amount) {
    console.log("START Bot");

    await instaPuppet.openInstagram();

    await instaPuppet.login(login, pw);

    await instaPuppet.openByTagAndLike(tags, Number(amount), login);

    await instaPuppet.closeBrowser();

    console.log("END Bot")
}
