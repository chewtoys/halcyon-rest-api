import express, { Request, Response } from 'express';
import cors from 'cors';
import logger from 'morgan';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './resources/swagger.json';
import config from './utils/config';

import corsMiddleware from './middleware/corsMiddleware';
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

app.options('/api', corsMiddleware);
app.use('/api/account', account);
app.use('/api/token', token);
app.use('/api/manage', manage);
app.use('/api/user', user);
app.use('/api/seed', seed);

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
