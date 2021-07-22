import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuctions(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  if (amount === 0) {
    await sqs.sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: ' Your item has not been sold!',
        recipient: seller,
        body: `Oh no! Your item "${title}" didn't get any bids. Better Luck next time!`,
      }),
    }).promise();
    return;
  }

  const notifySeller = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: ' Your item has been sold!',
      recipient: seller,
      body: `Wooohoo! You've sold your item to ${bidder}. The highest bid was ${amount}!`,
    }),
  }).promise();

  const notifyBidder = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: ' You won an auction!',
      recipient: bidder,
      body: `Wha great item you've won! The item was ${title} and you won ${amount}!`,
    }),
  }).promise();

  return Promise.all([notifySeller, notifyBidder]);
}