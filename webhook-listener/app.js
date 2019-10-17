const Client = require('kubernetes-client').Client;
const client = new Client({ version: '1.13' });

const express = require('express');
const app = express();
const port = 4000;
const namespace = 'default';

app.use(express.json())

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

client.addCustomResourceDefinition({
  "spec": {
    "group": "stable.liatr.io",
    "names": {
      "plural": 'branches',
    },
    "scope": "Namespaced",
    "version": "v1",
  },
});


const getRequestType = async(request) => {
  if (request.ref_type == 'branch') {
    try {
      const resp = await createBranchCRD(request);
      //return response back to main function to report back
    }
    catch (e) {
      console.log(e);
    }
  }
  else if (request.pull_request ? request.pull_request:false) {
    try {
      const resp = await createPRCRD(request);
      //return response back to main function to report back
    }
    catch (e) {
      console.log(e);
    }
  }
}

//const pullrequest = await client.apis['stable.liatr.io'].v1.namespaces(namespace).pullrequests.post({
  


const createPRCRD = async(request) => {
  if (request.pull_request ? request.pull_request:false) {
    console.log('created PR crd');
    const pullrequest = await client.apis['stable.liatr.io'].v1.namespaces(namespace).pullrequests.post({
      body: {
        apiVersion: 'stable.liatr.io/v1',
        kind: 'PullRequest',
        metadata: {
          name: `${pull_request.head.ref}-${Date.now()}`,
        },
        spec: {
          user: request.pull_request.user.login,
          branch: request.pull_request.head.ref,
          status: request.pull_request.state,
          id: request.pull_request.number,
        }
      },
    });
  }
}


const modifyPRCRD = async(request) => {
  if (request.pull_request ? request.pull_request:false) {
    const pullrequest = await client.apis['stable.liatr.io'].v1.namespaces(namespace).pullrequests.post({
      body: {
        apiVersion: 'stable.liatr.io/v1',
        kind: 'PullRequest',
        metadata: {
          name: `test-${Date.now()}`,
        },
      },
    });
  }
}

const createPREvent = async (body) => {
  const timestamp = new Date().toISOString();
  const body = {
    metadata: {
      name: `${body.metadata.name}`,
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
  };
  try {
    const response = await client.api.v1.namespaces(namespace).events.post({
      body: body
    });
    setTimeout(createPREvent, Math.random() * 3600000);
    return response.body;
  } catch (e) {
    console.log(e);
    throw new Error('Error in createPREvent');
  }
  setTimeout(createEvent, Math.random() * 3600000);
};


const run = async () => {
  app.post('/webhook', (req, res) => {

    console.log(req.body);
    //console.log(req._events);
    //console.log(req.data);
    getRequestType(req.body).then((resp) => {
      res.status(200).send({
        success: 'true',
      });
    });
  });

  app.listen(port, () => console.log(`webhook-listener listening on port ${port}`));
}

console.log('a');
run();
console.log('b');