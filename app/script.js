const BrowserWindow = require("@electron/remote").BrowserWindow;
const DiscordRPC = require("discord-rpc");

const clientId = "930729620465143839";

DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({
    transport: 'ipc'
});
const startTimestamp = new Date();

async function setStatus(details, state) {
    rpc.setActivity({
        details: details,
        state: state,
        timestamps: {
            start: Date.now()
        },
        assets: {
            large_image: "logo",
            large_text: "Listening to BMS",
        },
        buttons: [{
            label: "Listen on be-music.surge.sh",
            url: "https://be-music.surge.sh"
        }],
        instance: false,
    });
}

var bmstream = new Audio("https://be-music.spacet.me/radio/be-music-surge");
var metadata = new WebSocket("wss://be-music-surge-frontend.firebaseio.com/.ws?v=5");
var connectionAttempt = 0
var ping;

// establish and handling websocket
metadata.onopen = function (e) {
    console.info("Metadata socket established. Awaiting messages...");
    ping = setInterval(() => {
        metadata.send("0"); // ping every 1 minute to keep the connection alive
    }, 60000);
}

metadata.onclose = function (event) {
    console.info(`Connection closed: ${event.code} ${event.reason}`)
    clearInterval(ping)
}
metadata.onerror = function (e) {
    console.error("Oops! Couldn't connect to database server.")
    console.error(e.message)
    document.getElementById("no-internet").style.visibility = "visible";
}

// metadata handling (emulated the same thing be-music.surge.sh did)
var _ = false // avoid getting spitted a ton of error to the console. there is a better way to do this.
let eventTitle, eventUrl;

if ('mediaSession' in navigator) {
    var md_session = navigator.mediaSession;
}

md_session.setActionHandler('play', function (e) {

});
md_session.setActionHandler('pause', playStream("pause"));

metadata.addEventListener('message', function (event) {
    try {
        // ignore if event.data is not a valid JSON
        if (event.data.indexOf("{") == -1) return;
    
        // first time initialization
        if (_ == false && JSON.parse(event.data)["d"]["d"]["h"] == "s-usc1c-nss-332.firebaseio.com") { // send data to the websocket if contain this header
            metadata.send(`{"t":"d","d":{"r":1,"a":"s","b":{"c":{"sdk.js.6-5-0":1}}}}`)
            metadata.send(`{"t":"d","d":{"r":2,"a":"q","b":{"p":"/station","h":""}}}`)
            _ = true
            console.info("Websocket ready!")
            return
        }
        
        // temporary solution since the first data got sent missing some brackets
        try {
            var content = JSON.parse(event.data)["d"];
        }
        catch (e) {
            if(e == SyntaxError) {
                var content = JSON.parse(`{event.data} + "}}}}`)["d"];
            }
        }

        // OK status got sent after the song info for the first time
        // so this will (hopefully) ignore it
        if (_ == true && content["b"]["s"] == "ok") {
            console.info("Connection OK")
            return
        }
    
        // getting and assigning metadata
        if (_ == true && content["b"]["p"] == "station") {
            let songinfo = content["b"]["d"];
            eventTitle = songinfo.eventTitle || eventTitle;
            eventUrl = songinfo.eventUrl || eventUrl;
            document.querySelector("#artist").innerText = songinfo.artist;
            document.querySelector("#song-title").innerHTML = `<a href="${songinfo.entryUrl}">${songinfo.title}</a>`;
            document.querySelector("#album-title").innerHTML = `<a href="${eventUrl}">${eventTitle}</a>`;
            document.querySelector("#genre").innerText = "Genre: " + songinfo.genre;
    
            // set metadata for the media overlay, will break if the player is paused then played.
            if ('mediaSession' in navigator) {
                let media = new MediaMetadata({
                    title: songinfo.title,
                    artist: songinfo.artist,
                    album: eventTitle
                });
                md_session.metadata = media;
            }
            setStatus(`${songinfo.artist} - ${songinfo.title}`, eventTitle);
        }
        checkOverflow();
    }
    catch (e) {
        console.log(e)
    }

        


});


if (navigator.mediaSession.playbackState == "none") navigator.mediaSession.playbackState = 'paused';

// assign the button
function playStream(state) {
    console.log("playStream() called.")
    state = state | "";
    if (bmstream.readyState >= 2 && (state == "play" || bmstream.paused) && navigator.mediaSession.playbackState == 'paused') {
        bmstream.play();
        document.querySelector("#play-icon").style.display = "none";
        document.querySelector("#pause-icon").style.display = "inline";
        document.querySelector("#play-btn").classList.remove("blinking");
        navigator.mediaSession.playbackState = 'playing'
        console.info("Audio is playing.")
    } else if ((state == "pause" || !bmstream.paused) && navigator.mediaSession.playbackState == 'playing') {
        bmstream.pause();
        document.querySelector("#play-icon").style.display = "inline";
        document.querySelector("#pause-icon").style.display = "none";
        navigator.mediaSession.playbackState = 'paused'
        console.info("Audio is paused.");
    }
}

bmstream.addEventListener('loadeddata', function () {
    if (bmstream.readyState >= 2) playStream("play")
})

// Space to play/pause
window.addEventListener("keydown", function (event) {
    if (event.key == " " || event.key == "Spacebar") playStream()
}, true);

// window buttons
document.getElementById("close-btn").onclick = function () {
    BrowserWindow.getFocusedWindow().close()
}
document.getElementById("minimize-btn").onclick = function () {
    BrowserWindow.getFocusedWindow().minimize()
}
document.getElementById("reload-btn").onclick = function () {
    window.location.reload()
}

// window decoration
if (navigator.userAgent.toUpperCase().indexOf('MAC') >= 0) {
    document.getElementById("close-btn").style.display = "none";
    document.getElementById("minimize-btn").style.display = "none";
}

// replace all <a> href to onclick to use with shell.openExternal
document.body.addEventListener('click', event => {
    if (event.target.tagName.toLowerCase() === 'a') {
        event.preventDefault();
        require("electron").shell.openExternal(event.target.href);
    }
});

// discord rpc handling
rpc.login({
    clientId
}).catch(console.error);

// check if #song-title is overflowing 
function checkOverflow() {
    if (document.querySelector("#song-title").offsetWidth > (window.innerWidth - document.querySelector("#btn-bg-blocker").offsetWidth)) {
        document.querySelector("#song-title").classList.add("marquee");
    } else {
        document.querySelector("#song-title").classList.remove("marquee");
    }
}