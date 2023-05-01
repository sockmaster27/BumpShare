import Ably from "ably/build/ably-webworker.min";

import { createTokenRequest, generateClientId } from "../lib.js";

export async function onRequestGet(context) {
    const ably = new Ably.Rest({ key: context.env.ABLY_API_KEY });

    const sessionId = context.params.sessionId;
    const clientId = await generateClientId(sessionId);
    const capability = {
        "presence:*": ["presence", "subscribe"],
        "announce": ["publish"],
    };
    capability[`publish:${clientId}`] = ["publish", "subscribe"];
    const tokenRequest = await createTokenRequest(ably, clientId, capability);

    return new Response(JSON.stringify(tokenRequest));
}