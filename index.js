const puppeteer = require('puppeteer');
const path = require('path');
const cp = require('child_process')

const express = require("express");
let app = express();
const http = require('http');
const server = http.createServer(app);

const instaPuppet = require('./Bot/instagram');


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
        headless: false
    })
    const page = await browser.newPage()
    await page.goto("http://localhost:" + port, {
        waitUntil: 'networkidle2'
    });

})();



app.post('/clicked', (req, res) => {
    console.log("server side clicked")
    // console.log(req.body);
    startTheBot().then(result => {
        console.log("Start Bot result:", result)
    })
    res.sendStatus(200);
});

const startingBotProcess = () => {
    const n = cp.fork(__dirname + '/Bot/startBot.js');
    n.on('message', m => {
        console.log('PARENT got message', m);
    })

    n.send({hello: 'world'})
};

async function startTheBot() {
    console.log("START Bot");

    await instaPuppet.openInstagram();

    await instaPuppet.login('brodwolfsky', 'trinacria');

    await instaPuppet.openByTagAndLike(['java', 'javascript', 'ES6'], 3);

    await instaPuppet.closeBrowser();


    console.log("Insta Bot ist fertig!")
}
