import app from './app';

const port = app.get('port');

const server = app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});

export default server;
