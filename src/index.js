import Identicon from "identicon.js";

import { initBumpDetector } from "./bumpDetection.js";
import { NetworkConnection } from "./network.js";
import { PhysSim } from "./physics.js";



document.querySelector(".test").addEventListener("click", onDoubleBump);




let network;
const phys = new PhysSim();
let uploaded;

const uploadButton = document.querySelector(".upload");
const uploadInput = document.querySelector("#file-input");
uploadInput.addEventListener("change", () => {
    const reader = new FileReader();
    reader.onload = () => {
        uploadButton.textContent = "Reselect";
        uploadButton.classList.add("uploaded");
        uploaded = reader.result;
    };
    reader.readAsDataURL(uploadInput.files[0]);
});


const enableButton = document.querySelector(".start");
enableButton.addEventListener("click", () => {
    // Safari requires a user gesture to enable device orientation events.
    DeviceOrientationEvent.requestPermission?.();
    enableButton.remove();

    initBumpDetector(onStable, onUnstable, onBump, onDoubleBump);
    network = new NetworkConnection(onConnect, onEnter, onLeave);
});


function generateIdenticon(clientId) {
    var data = new Identicon(clientId, { background: [0, 0, 0, 0], format: "png" }).toString();
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${data}`;
    return img;
}

function onConnect(clientId) {
    const me = document.querySelector(".me");
    me.querySelector("img")?.remove();
    me.appendChild(generateIdenticon(clientId));
    me.classList.remove("waiting");

    phys.addNode("me", 0, 0, 2, (x, y) => {
        me.style.setProperty("--x", `${x}px`);
        me.style.setProperty("--y", `${y}px`);
    });
}

function onEnter(member) {
    const newDiv = document.createElement("div");
    newDiv.setAttribute("class", "node");
    newDiv.id = `ID${member.clientId}`;
    newDiv.appendChild(generateIdenticon(member.clientId));

    document.querySelector("body").appendChild(
        newDiv
    );

    const vPos = Math.random() * 300 - 150;
    phys.addNode(member.clientId, vPos, -200, 1, (x, y) => {
        newDiv.style.setProperty("--x", `${x}px`);
        newDiv.style.setProperty("--y", `${y}px`);
    });
}

function onLeave(member) {
    document.querySelector(`#ID${member.clientId}`).remove()
    phys.removeNode(member.clientId);
}


const upSound = new Audio("resources/up.mp3");
const downSound = new Audio("resources/down.mp3");
const bumpSound = new Audio("resources/bump.mp3");

function onStable() {
    const body = document.querySelector("body");
    body.classList.add("stable");
    upSound.play();
}

function onUnstable() {
    const body = document.querySelector("body");
    body.classList.remove("stable");
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
    phys.bump("me");

    // If this is triggered multiple times in a row, the transitionend event acts weird.
    // Only using setTimeout for timing the animation looks weird though, 
    // so it's just fallback if the transitionend doesn't successfully remove the class.
    me.addEventListener("transitionend", () => me.classList.remove("bumped"), { once: true });
    setTimeout(() => me.classList.remove("bumped"), 200);
}

async function onDoubleBump() {
    const me = document.querySelector(".me");
    me.classList.add("double-bumped");
    phys.bump("me");
    me.addEventListener("transitionend", () => me.classList.remove("double-bumped"), { once: true });
    setTimeout(() => me.classList.remove("double-bumped"), 200);

    bumpSound.play();

    // Sync files
    if (uploaded) network.publish(uploaded, onSentTo);
    const received = await network.request();
    for (const [clientId, data] of received) {
        onReceived(clientId, data);
    }
}


function onSentTo(clientId) {
    console.log(`Sent to ${clientId}`);
}

function onReceived(clientId, data) {
    console.log(`Received from ${clientId}`);
}
