const enableButton = document.querySelector("button");
enableButton.addEventListener("click", enableButton.remove);


const upSound = new Audio("resources/up.mp3");
const downSound = new Audio("resources/down.mp3");
const bumpSound = new Audio("resources/bump.mp3");


let stabilityTimer;
let potentiallyStable = false;
let stable = false;
let facingUp = false;

addEventListener("deviceorientation", (event) => {
    const { alpha, beta, gamma } = event;
    const thresh = 5;
    facingUp = -thresh < beta && beta < thresh
        && -thresh < gamma & gamma < thresh;
});

addEventListener("devicemotion", (event) => {
    const { x, y, z } = event.acceleration;
    const amplitude = x * x + y * y + z * z;

    const thresh = 1;
    const still = amplitude < thresh;

    const stableNow = still && facingUp;
    if (!stable && stableNow && !potentiallyStable)
        stabilityTimer = setTimeout(becomeStable, 300);
    else if (!stable && !stableNow && potentiallyStable)
        clearTimeout(stabilityTimer);

    else if (stable && !stableNow && potentiallyStable)
        stabilityTimer = setTimeout(becomeUnstable, 100);
    else if (stable && stableNow && !potentiallyStable)
        clearTimeout(stabilityTimer);

    potentiallyStable = stableNow;

    if (stable && amplitude >= 5)
        bump();
});


function becomeStable() {
    stable = true;
    const body = document.querySelector("body");
    body.style.backgroundColor = "green";
    upSound.play();
}

function becomeUnstable() {
    stable = false;
    const body = document.querySelector("body");
    body.style.backgroundColor = "red";
    downSound.play();
}

function bump() {
    const bang = document.querySelector(".bang");
    bumpSound.play();
    bang.classList.add("banged");

    // If this is triggered multiple times in a row, the transitionend event acts weird.
    // Only using setTimeout for timing the animation looks weird though, 
    // so it's just fallback if the transitionend doesn't successfully remove the class.
    bang.addEventListener("transitionend", () => bang.classList.remove("banged"), { once: true });
    setTimeout(() => bang.classList.remove("banged"), 200);
}