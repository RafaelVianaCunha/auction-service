import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function closeAuctions(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key : { id: auction.id },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await dynamodb.update(params).promise();
  return result;
}