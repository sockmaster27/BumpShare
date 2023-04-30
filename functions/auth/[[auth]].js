import Ably from 'ably/build/ably-webworker.min';

export async function onRequestGet(context) {
    const ably = new Ably.Rest({ key: context.env.ABLY_API_KEY });
    const clientId = await generateClientId(context.params.auth[0]);
    const tokenRequest = await createTokenRequest(ably, clientId);

    return new Response(JSON.stringify(tokenRequest));
}

async function generateClientId(sessionId) {
    const sessionIdRaw = new TextEncoder().encode(sessionId);
    const id = await crypto.subtle.digest("SHA-384", sessionIdRaw);
    const idString = Array.from(new Uint16Array(id)).map(n => n.toString(16)).join("");
    return idString;
}

async function createTokenRequest(ably, clientId) {
    const capability = {
        "presence:*": ["presence", "subscribe"],
    };

    return new Promise((resolve, reject) => {
        ably.auth.createTokenRequest({ clientId, capability }, (err, tokenRequest) => {
            if (err) reject(err);
            else resolve(tokenRequest);
        });
    });
}