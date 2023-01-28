import mongoose from 'mongoose';

mongoose.connect(process.env.DB_URL);

const db = mongoose.connection;
// sudo service mongodb start

const handleOpen = () => console.log('✅ Connected to DB');
const handleError = (error) => console.log('❌ DB Error', error);

db.on('error', handleError);
db.once('open', handleOpen);
