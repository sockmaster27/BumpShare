export class PhysSim {
    constructor() {
        this.ids = [];
        this.weight = {};
        this.pos = {};
        this.vel = {};
        this.setPos = {};

        this.preTime = performance.now();

        const simulate = () => {
            this.#simulate();
            requestAnimationFrame(simulate);
        };
        simulate();
    }

    addNode(id, x, y, weight, setPos) {
        this.ids.push(id);
        this.weight[id] = weight;
        this.pos[id] = { x, y };
        this.vel[id] = { x: 0, y: 0 };
        this.setPos[id] = setPos;
        setPos(x, y);
    }

    removeNode(id) {
        this.ids = this.ids.filter(i => i !== id);
        delete this.weight[id];
        delete this.pos[id];
        delete this.vel[id];
        delete this.setPos[id];
    }

    bump(id) {
        const before = this.weight[id];
        this.weight[id] *= 1.1;
        setTimeout(() => {
            this.weight[id] = before;
        }, 50);
    }

    #simulate() {
        // When tab is inactive, dt is huge, so we need to cap it
        const now = performance.now();
        const dt = Math.min(now - this.preTime, 50);
        this.preTime = now;

        const damp = 0.8;
        const centerPull = 0.0005;

        const acc = {};
        for (const id of this.ids) {
            const { x, y } = this.pos[id];

            // Drag towards center
            const w = this.weight[id];
            let accX = -centerPull * w * x;
            let accY = -centerPull * w * y;

            // Repel from other nodes
            for (const otherId of this.ids) {
                if (id === otherId) continue;

                // Declutter
                // if (this.pos[id].x === this.pos[otherId].x && this.pos[id].y === this.pos[otherId].y) this.pos[id].x += 10;

                const dx = this.pos[id].x - this.pos[otherId].x;
                const dy = this.pos[id].y - this.pos[otherId].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = (3 * this.weight[otherId] / Math.pow(dist, 2));
                accX += force * dx;
                accY += force * dy;
            }

            acc[id] = { x: accX, y: accY };
        }
        for (const id of this.ids) {
            this.vel[id].x += acc[id].x * dt;
            this.vel[id].y += acc[id].y * dt;
            this.vel[id].x *= damp;
            this.vel[id].y *= damp;

            const cap = 0.7;
            this.vel[id].x = Math.min(Math.max(this.vel[id].x, -cap), cap);
            this.vel[id].y = Math.min(Math.max(this.vel[id].y, -cap), cap);

            // Technically, only the average acceleration over the period dt should be applied here, but eh
            this.pos[id].x += this.vel[id].x * dt;
            this.pos[id].y += this.vel[id].y * dt;

            this.setPos[id](this.pos[id].x, this.pos[id].y);
        }
    }
}