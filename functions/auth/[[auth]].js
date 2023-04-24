import Ably from 'ably/build/ably-webworker.min';

export async function onRequestGet(context) {
    const ably = new Ably.Rest({ key: context.env.ABLY_API_KEY });
    const clientId = await generateClientId(context.params.auth[0]);
    const tokenRequest = await createTokenRequest(ably, clientId);

    return new Response(JSON.stringify(tokenRequest));
}

async function generateClientId(sessionId) {
    const sessionIdRaw = new TextEncoder().encode(decodeURIComponent(sessionId));
    const id = await crypto.subtle.digest("SHA-384", sessionIdRaw);
    return encodeURIComponent(new TextDecoder().decode(id));
}

async function createTokenRequest(ably, clientId) {
    const capability = {
        "*": ["subscribe", "presence"],
    };

    return new Promise((resolve, reject) => {
        ably.auth.createTokenRequest({ clientId, capability }, (err, tokenRequest) => {
            if (err) reject(err);
            else resolve(tokenRequest);
        });
    });
}