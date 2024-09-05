import awsServerlessExpress from 'aws-serverless-express';
import app from './app';
import { APIGatewayEvent, Context, Callback } from 'aws-lambda';

const server = awsServerlessExpress.createServer(app);

//entrypoint
export const handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
  awsServerlessExpress.proxy(server, event, context);
};
