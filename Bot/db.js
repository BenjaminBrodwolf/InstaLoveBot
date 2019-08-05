const firebase = require('firebase');

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBdL0fjhrpxys_fFZxMJ0gYr7Rv3rVQJFM",
    authDomain: "insta-bot-like.firebaseapp.com",
    databaseURL: "https://insta-bot-like.firebaseio.com",
    projectId: "insta-bot-like",
    storageBucket: "insta-bot-like.appspot.com",
    messagingSenderId: "399839633150",
    appId: "1:399839633150:web:1033fc6591c50812"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// console.log(firebase)
const database = firebase.database();
// let ref = database.ref('likedPost');


const like = async (post, tag, username) => {
    database.ref('likedPost/' + username + "/" + (new Date()).toLocaleDateString('de-DE') + "/" + tag)
        .ref.push({
        post: post
    })
};

const logError = async (errorMessage, tag, username) => {
    database.ref('errorLog/' + username + "/" + (new Date()).toLocaleDateString('de-DE') + "/" + errorMessage)
        .ref.push({
        error: errorMessage
    })
};


// let like = async (post, tag, username) => ref.push({
//     url: post,
//     tag: tag,
//     date: (new Date()).toLocaleDateString('de-DE')
// });


module.exports = {
    like,
    logError
};
