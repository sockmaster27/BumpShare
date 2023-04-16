const enableButton = document.querySelector("button");
enableButton.addEventListener("click", enableButton.remove);


const upSound = new Audio("resources/up.mp3");
const downSound = new Audio("resources/down.mp3");
upSound.play();

let preUp = false;
let preDown = false;

addEventListener("deviceorientation", (event) => {
    const { alpha, beta, gamma } = event;

    const thresh = 5;
    const facingUp = -thresh < beta && beta < thresh
        && -thresh < gamma & gamma < thresh;
    const facingDown = 180 - thresh < beta || beta < -180 + thresh
        && -thresh < gamma & gamma < thresh;

    const body = document.querySelector("body");
    body.style.backgroundColor = facingUp ? "green" : facingDown ? "blue" : "red";

    if (facingUp && !preUp)
        upSound.play();

    if (facingDown && !preDown)
        downSound.play();

    preUp = facingUp;
    preDown = facingDown;

});