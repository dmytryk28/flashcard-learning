import express from 'express';
import helmet from 'helmet';
import routes from './routes';

const app = express();

app.use(helmet());

app.use(routes);

export default app;
