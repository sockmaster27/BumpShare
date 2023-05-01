import Ably from "ably/build/ably-webworker.min";

import { createTokenRequest, generateClientId } from "../lib.js";
import { pubDelay } from "../../config.js";

export async function onRequestGet(context) {
    const ably = new Ably.Rest({ key: context.env.ABLY_API_KEY });

    const messages = await getHistory(ably);
    const publishIds = messages.map(m => m.clientId);

    const sessionId = context.params.sessionId;
    const clientId = await generateClientId(sessionId);
    const capability = {
        // must have at least one permission 🤷
        "announce": ["presence"],
    };
    for (const id of publishIds) {
        capability[`publish:${id}`] = ["subscribe"];
        ably.channels.get(`publish:${id}`).publish("listen", clientId);
    }
    const tokenRequest = await createTokenRequest(ably, clientId, capability);

    return new Response(JSON.stringify({ publishIds, tokenRequest }));
}

async function getHistory(ably) {
    const channel = ably.channels.get("announce");
    const messages = [];
    const start = Date.now() - pubDelay;

    return new Promise((resolve, reject) => {
        function callback(err, resultPage) {
            if (err) return reject(err);
            if (resultPage.isLast()) return resolve(messages);

            for (const message of resultPage.items)
                messages.push(message);

            resultPage.next(callback);
        }

        channel.history({ start }, callback);
    });
}