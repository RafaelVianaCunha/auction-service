import httpErrorHandler from '@middy/http-error-handler';
import createHttpError from 'http-errors';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import { getAuctionById } from './getAuction';
import middy from '@middy/core';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import validator from '@middy/validator';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema';

export async function uploadAuctionPicture(event){
    const { id } = event.pathParameters;
    const auction = await getAuctionById(id);
    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    let updateAuction;

    const { email } = event.requestContext.authorizer;
  
    // Validate auction ownership
    if (auction.seller !== email) {
      throw new createError.Forbidden(`You are not the seller of this auction!`);
    }

    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer);   
        updateAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
    } catch (error) {
        console.log(error);
        throw new createHttpError.InternalServerError(error);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(updateAuction) 
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(validator({ inputSchema: uploadAuctionPictureSchema }));