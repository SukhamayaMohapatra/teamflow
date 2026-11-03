import 'dotenv/config';
import app from './app.js';
import {connectDatabase} from './config/database.js';
const port=Number(process.env.PORT)||5000;
try { await connectDatabase(); const server=app.listen(port,()=>console.info(`API listening on ${port}`));
  const shutdown=signal=>{console.info(`${signal}: shutting down`);server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();};
  process.on('SIGTERM',()=>shutdown('SIGTERM')); process.on('SIGINT',()=>shutdown('SIGINT'));
} catch(error) { console.error('Startup failed',error); process.exit(1); }
