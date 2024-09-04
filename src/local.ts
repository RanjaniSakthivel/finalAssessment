import app from './app';
const port = process.env.port || 3000;

// Server
app.listen(port, () => {
   console.log(`Listening on: http://localhost:${port}`);
});