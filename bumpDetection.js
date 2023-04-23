export function initBumpDetector(onStable, onUnstable, onBump, onDoubleBump) {
    let stabilityTimer;
    let potentiallyStable = false;
    let stable = false;
    let facingUp = false;

    let lastBumpTime = 0;
    const doubleBumpThresh = 500;

    let inBump = false;

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
            stabilityTimer = setTimeout(() => {
                stable = true;
                onStable()
            }, 300);
        else if (!stable && !stableNow && potentiallyStable)
            clearTimeout(stabilityTimer);

        else if (stable && !stableNow && potentiallyStable)
            stabilityTimer = setTimeout(() => {
                stable = false;
                onUnstable();
            }, 100);
        else if (stable && stableNow && !potentiallyStable)
            clearTimeout(stabilityTimer);

        potentiallyStable = stableNow;

        if (stable && amplitude >= 5 && !inBump) {
            const now = performance.now();
            if (now - lastBumpTime < doubleBumpThresh) {
                lastBumpTime = 0;
                onDoubleBump();
            } else {
                lastBumpTime = now;
                onBump();
            }

            inBump = true;
            setTimeout(() => inBump = false, 200);
        }
    });
}