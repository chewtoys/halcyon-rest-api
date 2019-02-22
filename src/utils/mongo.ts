import mongoose from 'mongoose';
import config from './config';

const connect = () => {
    mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true });
    mongoose.set('useCreateIndex', true);
    mongoose.Promise = global.Promise;

    const connection = mongoose.connection;
    connection.on(
        'error',
        console.error.bind(console, 'MongoDB connection error:')
    );
};

export default connect;
