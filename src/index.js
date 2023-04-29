import Identicon from "identicon.js";

import { initBumpDetector } from "./bumpDetection.js";
import { initNetwork } from "./network.js";

const enableButton = document.querySelector(".start");
enableButton.addEventListener("click", () => {
    // Safari requires a user gesture to enable device orientation events.
    DeviceOrientationEvent.requestPermission?.();
    enableButton.remove();

    const me = document.querySelector(".me");
    me.classList.remove("waiting");

    initNetwork(onConnect, onEnter, onLeave);
    initBumpDetector(onStable, onUnstable, onBump, onDoubleBump);
});


function generateIdenticon(clientId) {
    var data = new Identicon(clientId, { background: [0, 0, 0, 0], format: "png" }).toString();
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${data}`;
    return img;
}

function onConnect(clientId) {
    const me = document.querySelector(".me");
    me.appendChild(generateIdenticon(clientId));
    me.classList.add("connected");
}

function onEnter(member) {
    const newDiv = document.createElement("div");
    newDiv.setAttribute("class", "node");
    newDiv.style.marginTop = "10px";
    newDiv.id = `ID${member.clientId}`;
    newDiv.appendChild(generateIdenticon(member.clientId));

    document.querySelector("body").appendChild(
        newDiv
    );
}

function onLeave(member) {
    document.querySelector(`#ID${member.clientId}`).remove()
}


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
    const node = document.querySelector(".me");
    node.classList.remove("bumped");
}

function onBump() {
    const me = document.querySelector(".me");
    me.classList.add("bumped");

    // If this is triggered multiple times in a row, the transitionend event acts weird.
    // Only using setTimeout for timing the animation looks weird though, 
    // so it's just fallback if the transitionend doesn't successfully remove the class.
    me.addEventListener("transitionend", () => me.classList.remove("bumped"), { once: true });
    setTimeout(() => me.classList.remove("bumped"), 200);
}

function onDoubleBump() {
    onBump();
    bumpSound.play();
}
