const Client = require('kubernetes-client').Client;
const client = new Client({ version: '1.13' });
const JSONStream = require('json-stream');

const express = require('express')
const app = express()
const port = 3000
const namespace = 'default';

app.get('/', async (req, res) => {
  const response = await client.api.v1.namespaces(namespace).events.get();
  if (response.statusCode < 200 || response.statusCode >= 400) {
    throw new Error('Failed to fetch events');
  }
  response.body.items.forEach((item) => {
    console.log(item);
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

client.api.v1.namespaces.get().then((response) => {
  console.log(response);
});

const watch = async () => {
  do {
    const stream = client.api.v1.watch.namespaces(namespace).events.getStream();
    const jsonStream = new JSONStream();
    stream.pipe(jsonStream);
    await readStream(jsonStream);
    stream.destroy();
    jsonStream.destroy();
  } while (true);
};

const readStream = (jsonStream) => new Promise((resolve, reject) => {
  let skipInitial = false;
  let initialTimeout = setTimeout(() => { skipInitial = false; }, 500);
  jsonStream
  .on('data', (object) => {
    if (object.type === 'ADDED' && skipInitial) {
      console.log('Skipping intitial resource');
      clearTimeout(initialTimeout);
      initialTimeout = setTimeout(() => { skipInitial = false; }, 500);
    } else {
      console.log('Watch stream updated');
      console.log(object);
    }
  })
  .on('end', (object) => {
    console.log('Watch stream ended');
    resolve();
  });
});

watch();
