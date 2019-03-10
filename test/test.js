const server = require('./../server/app');
const http = require('http');
const rimraf = require('rimraf');
const path = require('path');
const fs = require('fs-extra');

async function clean() {
    return new Promise((resolve, reject) => {
        rimraf(path.resolve(__dirname, '../.cache'), (error) => {
            if(error) {
                reject(error)
            } else {
                resolve();
            }
        });
    });
}

async function asyncGet(url) {
    return new Promise((resolve)=> {
        http.get(url, (res) => {
            resolve(res);
            res.st
        });
    });
}

function assert(what, error) {
    if(!what) throw new Error(error);
}

async function runTests() {
    try {
        await clean();
        let result = await asyncGet('http://localhost:3000/ce-decorators');
        assert(result.statusCode === 302, 'Send redirect test');

        result = await asyncGet('http://localhost:3000/ce-decorators@2.5.0/');
        assert(result.statusCode === 200, 'get index');
        assert(fs.existsSync(path.resolve(__dirname, '../.cache/ce-decorators/2.5.0')), 'Cache exists');

        result = await asyncGet('http://localhost:3000/ce-decorators@2.4.0/');
        assert(result.statusCode === 200, 'get index');
        assert(fs.existsSync(path.resolve(__dirname, '../.cache/ce-decorators/2.4.0')), 'Cache exists');

        result = await asyncGet('http://localhost:3000/ce-decorators@2.5.0/package.json');
        assert(result.statusCode === 200, 'get file');
        
        result = await asyncGet('http://localhost:3000/ce-decorators@2.5.0/packagenotexists.json');
        assert(result.statusCode === 404, 'get file not existent');

        result = await asyncGet('http://localhost:3000/package-which-definitly-not-exists@2.5.0/');
        assert(result.statusCode === 404, 'get package that does not exists');

        server.default.close();
        await clean();
        process.exit(0);
    } catch(e) {
        server.default.close();
        await clean();
        console.error(e);
        process.exit(-1);
    }
}

server.default.on('listening', () => {
    runTests();
});