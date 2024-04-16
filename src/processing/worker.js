const path = require('path');
const { workerData } = require('worker_threads');

require('ts-node').register();
const { task } = require(path.resolve(__dirname, workerData.path));
const { ProcessingListener } = require('../../dist/src/processing/ProcessingListener');

task(new ProcessingListener(workerData.context));