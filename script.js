const BrowserWindow = require("@electron/remote").BrowserWindow;
const DiscordRPC = require("discord-rpc");

const clientId = "930729620465143839";

DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setStatus(details, state) {
    rpc.setActivity({
        details: details,
        state: state,
        timestamps: {start: Date.now()},
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
var metadata = new WebSocket("wss://s-usc1c-nss-351.firebaseio.com/.ws?v=5&ns=be-music-surge-frontend");

// establish and handling websocket
metadata.onopen = function(e) {
    console.info("Metadata socket established. Awaiting messages...");
}
metadata.onclose = function(event) {
    console.info(`Connection closed: ${event.code} ${event.reason}`)
}
metadata.onerror = function(e) {
    console.error(e.message)
}

// metadata handling (emulated the same thing be-music.surge.sh did)
var _ = false // avoid getting spitted a ton of error to the console. better fix this soon.
let eventTitle, eventUrl;
metadata.addEventListener('message', function (event) {
    var content = JSON.parse(event.data)["d"];

    if (_ == false && content["d"]["h"] == "s-usc1c-nss-351.firebaseio.com") { // send data to the websocket if contain this header
        metadata.send(`{"t":"d","d":{"r":1,"a":"s","b":{"c":{"sdk.js.6-5-0":1}}}}`)
        metadata.send(`{"t":"d","d":{"r":2,"a":"q","b":{"p":"/station","h":""}}}`)
        var ping = setInterval(() => {
            metadata.send("0"); // ping every 1 minute to keep the connection alive
        }, 60000);
        _ = true;
    }

    // getting and assigning metadata
    if (content["b"]["p"] == "station") {
        let songinfo = content["b"]["d"];
        eventTitle = songinfo.eventTitle || eventTitle;
        eventUrl = songinfo.eventUrl || eventUrl;
        document.querySelector("#artist").innerText = songinfo.artist;
        document.querySelector("#song-title").innerHTML = `<a href="${songinfo.entryUrl}">${songinfo.title}</a>`;
        document.querySelector("#album-title").innerHTML = `<a href="${eventUrl}">${eventTitle}</a>`;
        document.querySelector("#genre").innerText = "Genre: " + songinfo.genre;

        /* // set metadata for the media overlay, will break if the player is paused then played.
        if ('mediaSession' in navigator) {
            let md_session = navigator.mediaSession
            let media = new MediaMetadata({
                title: songinfo.title,
                artist: songinfo.artist,
                album: eventTitle
            });
            md_session.metadata = media;
            md_session.setActionHandler('play', playStream());
            md_session.setActionHandler('pause', playStream()); 
        } */// disabled until i figure out how this work
        setStatus(`${songinfo.artist} - ${songinfo.title}`, eventTitle);
    }
});   

function playStream() {
    if (bmstream.paused) {
        bmstream.play();
        document.querySelector("#play-icon").style.display = "none";
        document.querySelector("#pause-icon").style.display = "inline";
        document.querySelector("#play-btn").classList.remove("blinking");
        console.info("Audio is playing.")
    }
    else {
        bmstream.pause();
        document.querySelector("#play-icon").style.display = "inline";
        document.querySelector("#pause-icon").style.display = "none";
        console.info("Audio is paused.");
    }
}

bmstream.addEventListener('loadeddata',function(){if(bmstream.readyState >= 2)playStream()})

// Space to play/pause
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) return
    else if (event.key == " " || event.key == "Spacebar") playStream()
    event.preventDefault();
}, true);

// window buttons
document.getElementById("close-btn").onclick = function() {BrowserWindow.getFocusedWindow().close()}
document.getElementById("minimize-btn").onclick = function() {BrowserWindow.getFocusedWindow().minimize()}
document.getElementById("reload-btn").onclick = function() {window.location.reload()}

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

rpc.login({ clientId }).catch(console.error);