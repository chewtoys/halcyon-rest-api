import app from './app';

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});

export default server;
