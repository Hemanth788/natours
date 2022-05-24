const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {});

const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('App is running at ', port);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log('uncaughtException', err.name, err.message);
  server.close(() => process.exit(1));
});
