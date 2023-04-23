export function initBumpDetector(onStable, onUnstable, onBump, onDoubleBump) {
    /** 
     * Whether or not the device is angled like it is laying flat on a table with the screen facing up 
     */
    let facingUp = false;

    /**
     * Whether or not the device is currently in the stable state
     * 
     * This state is biased against transitioning, 
     * which only happens after stability has been confirmed for a certain amount of time
     */
    let stable = false;
    /**
     * The time in milliseconds that the device has to be stable for the state to change
     */
    const stableDelay = 300;
    /**
     * The time in milliseconds that the device has to be unstable for the state to change
     */
    const unstableDelay = 100;
    /**
     * Whether or not the device was stable in the last event
     */
    let stableBefore = false;
    /**
     * ID of the timer that will be set when the device is potentially (un)stable
     */
    let stabilityTimer;

    /**
     * The timestamp (as reported by performance.now()) of the last bump
     */
    let lastBumpTime = 0;
    /**
     * The max period in milliseconds that can pass between two bumps to be considered a double bump
     */
    const doubleBumpThresh = 500;
    /**
     * Whether or not the device is currently in the middle of a bump
     * 
     * No new bumps will be registered while this is true
     */
    let inBump = false;
    /** 
     * The minimum duration in milliseconds from a bump is registered to when a new bump can be registered
     * 
     * If this is too short, the device will register multiple bumps for a single bump
     */
    const bumpDuration = 200;

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

        // Transition to stable state
        if (!stable && stableNow && !stableBefore)
            stabilityTimer = setTimeout(() => {
                stable = true;
                onStable()
            }, stableDelay);
        else if (!stable && !stableNow && stableBefore)
            clearTimeout(stabilityTimer);

        // Transition to unstable state
        else if (stable && !stableNow && stableBefore)
            stabilityTimer = setTimeout(() => {
                stable = false;
                onUnstable();
            }, unstableDelay);
        else if (stable && stableNow && !stableBefore)
            clearTimeout(stabilityTimer);

        // Bump detection
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
            setTimeout(() => inBump = false, bumpDuration);
        }

        stableBefore = stableNow;
    });
}