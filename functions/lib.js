export async function createTokenRequest(ably, clientId, capability) {
    return new Promise((resolve, reject) => {
        ably.auth.createTokenRequest({ clientId, capability }, (err, tokenRequest) => {
            if (err) reject(err);
            else resolve(tokenRequest);
        });
    });
}

export async function generateClientId(sessionId) {
    const sessionIdRaw = new TextEncoder().encode(sessionId);
    const id = await crypto.subtle.digest("SHA-384", sessionIdRaw);
    const idString = Array.from(new Uint16Array(id)).map(n => n.toString(16)).join("");
    return idString;
}