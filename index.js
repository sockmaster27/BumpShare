addEventListener("deviceorientation", (event) => {
    const { alpha, beta, gamma } = event;

    const thresh = 1.3;
    const flat = -thresh < beta && beta < thresh
        && -thresh < gamma & gamma < thresh;

    const body = document.querySelector("body");
    body.style.backgroundColor = flat ? "green" : "red";
});