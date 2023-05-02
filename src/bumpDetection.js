export class BumpDetector {
    constructor(onStable, onUnstable, onBump, onDoubleBump) {
        this.onStable = onStable;
        this.onUnstable = onUnstable;
        this.onBump = onBump;
        this.onDoubleBump = onDoubleBump;

        /** 
         * Whether or not the device is angled like it is laying flat on a table with the screen facing up 
         */
        this.facingUp = false;

        /**
         * Whether or not the device is currently in the stable state
         * 
         * This state is biased against transitioning, 
         * which only happens after stability has been confirmed for a certain amount of time
         */
        this.stable = false;
        /**
         * The time in milliseconds that the device has to be stable for the state to change
         */
        this.stableDelay = 300;
        /**
         * The time in milliseconds that the device has to be unstable for the state to change
         */
        this.unstableDelay = 200;
        /**
         * Whether or not the device was stable in the last event
         */
        this.stableBefore = false;
        /**
         * ID of the timer that will be set when the device is potentially (un)stable
         */
        this.stabilityTimer = null;

        /**
         * The timestamp (as reported by performance.now()) of the last bump
         */
        this.lastBumpTime = 0;
        /**
         * The max period in milliseconds that can pass between two bumps to be considered a double bump
         */
        this.doubleBumpThresh = 500;
        /**
         * Whether or not the device is currently in the middle of a bump
         * 
         * No new bumps will be registered while this is true
         */
        this.inBump = false;
        /** 
         * The minimum duration in milliseconds from a bump is registered to when a new bump can be registered
         * 
         * If this is too short, the device will register multiple bumps for a single bump
         */
        this.bumpDuration = 200;

        this.orientationCallback = e => this.#onOrientation(e);
        this.motionCallback = e => this.#onMotion(e);

        addEventListener("deviceorientation", this.orientationCallback);
        addEventListener("devicemotion", this.motionCallback);
    }

    stop() {
        removeEventListener("deviceorientation", this.orientationCallback);
        removeEventListener("devicemotion", this.motionCallback);
    }

    #onOrientation(event) {
        const { alpha, beta, gamma } = event;
        const thresh = 5;
        this.facingUp = -thresh < beta && beta < thresh
            && -thresh < gamma & gamma < thresh;
    }

    #onMotion(event) {
        const { x, y, z } = event.acceleration;
        const amplitude = x * x + y * y + z * z;

        const thresh = 1;
        const still = amplitude < thresh;

        const stableNow = still && this.facingUp;

        // Transition to stable state
        if (!this.stable && stableNow && !this.stableBefore)
            this.stabilityTimer = setTimeout(() => {
                this.stable = true;
                this.onStable()
            }, this.stableDelay);
        else if (!this.stable && !stableNow && this.stableBefore)
            clearTimeout(this.stabilityTimer);

        // Transition to unstable state
        else if (this.stable && !stableNow && this.stableBefore)
            this.stabilityTimer = setTimeout(() => {
                this.stable = false;
                this.onUnstable();
            }, this.unstableDelay);
        else if (this.stable && stableNow && !this.stableBefore)
            clearTimeout(this.stabilityTimer);

        // Bump detection
        if (this.stable && amplitude >= 5 && !this.inBump) {
            const now = performance.now();
            if (now - this.lastBumpTime < this.doubleBumpThresh) {
                this.lastBumpTime = 0;
                this.onDoubleBump();
            } else {
                this.lastBumpTime = now;
                this.onBump();
            }

            this.inBump = true;
            setTimeout(() => this.inBump = false, this.bumpDuration);
        }

        this.stableBefore = stableNow;
    }
}