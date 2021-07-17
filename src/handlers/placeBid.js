import AWS from "aws-sdk";
import createError from "http-errors";
import commonMiddleware from "../lib/commonMiddleware";
import { getAuctionById } from "./getAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

//Place a bid
async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;

  if (typeof amount !== "number") {
    throw createError(400, "Amount must be a number");
  }

  const auction = await getAuctionById(id);
  
  if(auction.status !== "OPEN"){
    throw createError.Forbidden("You cannot bid on closed auctions!");
  }

  if(amount <= auction.highestBid.amount){
    throw createError.Forbidden("You cannot bid lower than the current highest bid");
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount',
    ConditionExpression: 'attribute_exists(id)',
    ExpressionAttributeValues: {
      ':amount': amount
    },
    ReturnValues: 'ALL_NEW',
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid);
