const enableButton = document.querySelector("button");
enableButton.addEventListener("click", enableButton.remove);


const upSound = new Audio("resources/up.mp3");
const downSound = new Audio("resources/down.mp3");
const bumpSound = new Audio("resources/bump.mp3");

let facingUp = false;
let facingDown = false;

addEventListener("deviceorientation", (event) => {
    const { alpha, beta, gamma } = event;

    const thresh = 5;
    const facingUpNow = -thresh < beta && beta < thresh
        && -thresh < gamma & gamma < thresh;
    const facingDownNow = (180 - thresh < beta || beta < -180 + thresh)
        && -thresh < gamma & gamma < thresh;

    const body = document.querySelector("body");
    body.style.backgroundColor = facingUpNow ? "green" : facingDownNow ? "blue" : "red";

    if (facingUpNow && !facingUp)
        upSound.play();

    if (facingDownNow && !facingDown)
        downSound.play();

    facingUp = facingUpNow;
    facingDown = facingDownNow;
});

const bang = document.querySelector(".bang");
addEventListener("devicemotion", (event) => {
    const { x, y, z } = event.acceleration;
    const amplitude = x * x + y * y + z * z;

    if (facingUp && amplitude >= 5) {
        bumpSound.play();
        bang.classList.add("banged");

        // If this is triggered multiple times in a row, the transitionend event acts weird.
        // Only using setTimeout for timing the animation looks weird though, 
        // so it's just fallback if the transitionend doesn't successfully remove the class.
        bang.addEventListener("transitionend", () => bang.classList.remove("banged"), { once: true });
        setTimeout(() => bang.classList.remove("banged"), 200);
    }
});