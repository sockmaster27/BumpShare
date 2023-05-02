import Ably from "ably/build/ably-webworker.min";

import { generateClientId } from "../lib.js";
import { pubDelay } from "../../config.js";


export async function onRequestPost(context) {
    const sessionId = context.params.sessionId;
    const clientId = await generateClientId(sessionId);

    const file = await context.request.text();
    await context.env.BUCKET.put(clientId, file);

    return new Response("OK");
}

export async function onRequestGet(context) {
    const ably = new Ably.Rest({ key: context.env.ABLY_API_KEY });

    const sessionId = context.params.sessionId;
    const clientId = await generateClientId(sessionId);

    const messages = await getHistory(ably);
    const publishIds = messages.map(m => m.clientId).filter(id => id !== clientId);
    for (const id of publishIds) {
        ably.channels.get(`publish:${id}`).publish("listen", clientId);
    }

    const objects = await Promise.all(publishIds.map(id => context.env.BUCKET.get(id)));
    const files = await Promise.all(objects.map(o => o.text()));

    return new Response(JSON.stringify(files));
}

async function getHistory(ably) {
    const channel = ably.channels.get("announce");
    const messages = [];
    const start = Date.now() - pubDelay;

    return new Promise((resolve, reject) => {
        function callback(err, resultPage) {
            if (err) return reject(err);

            for (const message of resultPage.items) {
                messages.push(message);
            }

            if (resultPage.isLast()) return resolve(messages);
            resultPage.next(callback);
        }

        channel.history({ start }, callback);
    });
}