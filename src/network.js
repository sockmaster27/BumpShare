import Ably from "ably";

export function initNetwork(onConnect, onEnter, onLeave) {
    const sessionId = crypto.getRandomValues(new Uint16Array(32));
    const sessionIdString = Array.from(sessionId).map(n => n.toString(16)).join("");

    let clientId;

    const ably = new Ably.Realtime.Promise({
        transportParams: { remainPresentFor: 1000 },
        authCallback: async (tokenParams, callback) => {
            const response = await fetch(`/auth/${sessionIdString}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const tokenRequest = await response.json();
            clientId = tokenRequest.clientId;
            onConnect(clientId);
            callback(null, tokenRequest);
        }
    });

    const channel = ably.channels.get("bump");
    channel.presence.enter();

    channel.presence.subscribe("enter", (m) => { if (m.clientId !== clientId) onEnter(m) });
    channel.presence.subscribe("present", (m) => { if (m.clientId !== clientId) onEnter(m) });
    channel.presence.subscribe("leave", onLeave);
}
