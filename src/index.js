import { initBumpDetector } from "./bumpDetection.js";

const enableButton = document.querySelector(".start");
enableButton.addEventListener("click", () => {
    // Safari requires a user gesture to enable device orientation events.
    DeviceOrientationEvent.requestPermission?.();
    enableButton.remove();

    const bang = document.querySelector(".bang");
    bang.classList.remove("waiting");

    initBumpDetector(onStable, onUnstable, onBump, onDoubleBump);
});


const upSound = new Audio("resources/up.mp3");
const downSound = new Audio("resources/down.mp3");
const bumpSound = new Audio("resources/bump.mp3");

function onStable() {
    const body = document.querySelector("body");
    body.style.backgroundColor = "green";
    upSound.play();
}

function onUnstable() {
    const body = document.querySelector("body");
    body.style.backgroundColor = "red";
    downSound.play();

    // Cancel last bump
    bumpSound.pause();
    bumpSound.currentTime = 0;
    const bang = document.querySelector(".bang");
    bang.classList.remove("banged");
}

function onBump() {
    const bang = document.querySelector(".bang");
    bang.classList.add("banged");

    // If this is triggered multiple times in a row, the transitionend event acts weird.
    // Only using setTimeout for timing the animation looks weird though, 
    // so it's just fallback if the transitionend doesn't successfully remove the class.
    bang.addEventListener("transitionend", () => bang.classList.remove("banged"), { once: true });
    setTimeout(() => bang.classList.remove("banged"), 200);
}

function onDoubleBump() {
    onBump();
    bumpSound.play();
}


const sessionId = crypto.getRandomValues(new Uint32Array(32));
const sessionIdString = Array.from(sessionId).map(n => n.toString(32)).join("");

const ably = new Ably.Realtime.Promise({
    transportParams: { remainPresentFor: 1000 },
    authCallback: async (tokenParams, callback) => {
        const response = await fetch(`/auth/${sessionIdString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const tokenRequest = await response.json();
        callback(null, tokenRequest);
    }
});

const channel = ably.channels.get("bump");
channel.presence.enter();

channel.presence.subscribe("enter", onEnter);
channel.presence.subscribe("present", onEnter);
channel.presence.subscribe("leave", onLeave);

function onEnter(member) {
    const newDiv = document.createElement("div");
    newDiv.setAttribute("class", "bang");
    newDiv.style.marginTop = "10px";
    newDiv.id = `ID${member.clientId}`;
    document.querySelector("body").appendChild(
        newDiv
    );
}

function onLeave(member) {
    document.querySelector(`#ID${member.clientId}`).remove()
}
