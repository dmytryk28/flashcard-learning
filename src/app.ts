import express from 'express';
import helmet from 'helmet';
import routes from './routes';
import cors from 'cors';

const app = express();

app.use(helmet());

app.use(cors({ origin: '*' }));

app.use(routes);

export default app;
