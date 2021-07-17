import { getEndedAuctions } from "../lib/getEndedAuctions";
import { closeAuctions } from "../lib/closeAuctions";
import createError from "http-errors";

async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map((auction) =>
      closeAuctions(auction)
    );
    await Promise.all(closePromises);

    return {closed: closePromises.length} 
  } catch (err) {
    console.log(err);
    return createError.InternalServerError(err);
  }
}

export const handler = processAuctions;
