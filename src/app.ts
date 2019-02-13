import express, { Request, Response } from 'express';
import cors from 'cors';
import logger from 'morgan';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './resources/swagger.json';
import config from './utils/config';

import notFoundMiddleware from './middleware/notFoundMiddleware';
import errorMiddleware from './middleware/errorMiddleware';

import seed from './routes/seed';
import account from './routes/account';
import token from './routes/token';
import manage from './routes/manage';
import user from './routes/user';

mongoose.connect(
    config.MONGODB_URI,
    { useNewUrlParser: true }
);
mongoose.set('useCreateIndex', true);
mongoose.Promise = global.Promise;

const connection = mongoose.connection;
connection.on(
    'error',
    console.error.bind(console, 'MongoDB connection error:')
);

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cors());

app.use('/account', account);
app.use('/token', token);
app.use('/manage', manage);
app.use('/user', user);
app.use('/seed', seed);

app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, { customSiteTitle: 'Halcyon Api' })
);
app.use('/$', (req: Request, res: Response) => res.redirect(301, '/swagger/'));

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.set('port', process.env.PORT || 3001);

export default app;
