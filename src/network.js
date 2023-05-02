import Ably from "ably";

import { pubDelay } from "../config.js";

export class NetworkConnection {
    constructor(onConnect, onEnter, onLeave) {
        const sessionIdRaw = crypto.getRandomValues(new Uint16Array(32));
        this.sessionId = Array.from(sessionIdRaw).map(n => n.toString(16)).join("");

        this.ably = new Ably.Realtime.Promise({
            transportParams: { remainPresentFor: 10000 },
            authCallback: async (tokenParams, callback) => {
                const response = await fetch(`/auth/${this.sessionId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const tokenRequest = await response.json();
                this.clientId = tokenRequest.clientId;
                callback(null, tokenRequest);
            }
        });

        this.ably.connection.on("connected", () => {
            onConnect(this.clientId);

            const channel = this.ably.channels.get("presence:bump");
            channel.presence.enter();

            channel.presence.subscribe("enter", (m) => { if (m.clientId !== this.clientId) onEnter(m) });
            channel.presence.subscribe("present", (m) => { if (m.clientId !== this.clientId) onEnter(m) });
            channel.presence.subscribe("leave", onLeave);
        });
    }

    async share(file) {
        await fetch(`/share/${this.sessionId}`, {
            method: "POST",
            body: file,
        });
    }

    announce(onSentTo) {
        const pubChannel = this.ably.channels.get(`publish:${this.clientId}`);
        pubChannel.subscribe("listen", m => onSentTo(m.data));

        const announceChannel = this.ably.channels.get("announce");
        announceChannel.publish("", "");

        setTimeout(() => {
            pubChannel.unsubscribe("listen", onSentTo);
        }, pubDelay);
    }

    async request() {
        const files = await fetch(`/share/${this.sessionId}`, {
            method: "GET",
        });
        return await files.json();
    }
}