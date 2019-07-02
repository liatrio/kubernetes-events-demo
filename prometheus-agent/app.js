const Client = require('kubernetes-client').Client;
const client = new Client({ version: '1.13' });
const JSONStream = require('json-stream');
const promClient = require('prom-client');
const pullRequestCounter = new promClient.Counter({
  name: 'pull_requests',
  help: 'Pull Requests'
});

const express = require('express')
const app = express()
const port = 3000
const namespace = 'default';

app.get('/metrics', async (req, res) => {
  // const response = await client.api.v1.namespaces(namespace).events.get();
  // if (response.statusCode < 200 || response.statusCode >= 400) {
  //   throw new Error('Failed to fetch events');
  // }
  // response.body.items.forEach((item) => {
  //   console.log(item);
  // });
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// client.api.v1.namespaces.get().then((response) => {
//   console.log(response);
// });

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
  let skipInitial = true;
  let initialTimeout = setTimeout(() => { skipInitial = false; }, 500);
  jsonStream
    .on('data', (object) => {
      if (object.type === 'ADDED' && skipInitial) {
        clearTimeout(initialTimeout);
        initialTimeout = setTimeout(() => { skipInitial = false; }, 500);
      } else {
        console.log('Watch stream updated');
        pullRequestCounter.inc();
      }
    })
    .on('end', (object) => {
      console.log('Watch stream ended');
      resolve();
    });
});

console.log('y');
watch();
console.log('z');

client.addCustomResourceDefinition({
    "spec": {
      "group": "stable.liatr.io",
      "names": {
        "plural": 'pullrequests',
      },
      "scope": "Namespaced",
      "version": "v1",
    },
});

const run = async () => {
  console.log(1);
  const pullrequest = await client.apis['stable.liatr.io'].v1.namespaces(namespace).pullrequests.post({
    body: {
      apiVersion: 'stable.liatr.io/v1',
      kind: 'PullRequest',
      metadata: {
        name: `test-${Date.now()}`,
      },
    },
  });

  console.log(2);
  createEvent = () => {
    console.log(3);
    const timestamp = new Date().toISOString();
    client.api.v1.namespaces(namespace).events.post({
      body: {
        metadata: {
          name: `pullrequest-${Date.now()}`,
        },
        reason: 'pull_requests',
        message: 'Pull Request',
        type: 'Normal',
        reportingComponent: 'sdm.lead.liatrio/operator-jenkins',
        source: {
          component: 'sdm.lead.liatrio/operator-jenkins',
        },
        involvedObject: {
          ...pullrequest.metadata,
          apiVersion: pullrequest.apiVersion,
          kind: pullrequest.kind,
        },
        count: 1,
        firstTimestamp: timestamp,
        lastTimestamp: timestamp,
      }
    });
    setTimeout(createEvent, Math.random() * 3600000);
    console.log(4);
  };

  setTimeout(createEvent, Math.random() * 3600000);
}

console.log('a');
run();
console.log('b');
