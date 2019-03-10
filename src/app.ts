import * as express from 'express';
import * as path from 'path'
import { Readable } from 'stream';
import { mkdirs, existsSync, lstat, readdir, lstatSync, readJSONSync } from 'fs-extra'
import fetch from 'node-fetch';
import { x } from 'tar';
import dirlist from './dirlist';


const API = 'https://registry.npmjs.com/';
const CACHE = existsSync(path.resolve('/cache')) ? lstatSync(path.resolve('/cache')).isDirectory() ? path.resolve('/cache') : path.resolve('./.cache') : path.resolve('./.cache');
const REQUEST_REGEX = /\/([a-zA-Z\-_0-9]+)(@([a-zA-Z0-9\.\-_]+))?(\/(.*))?/;

const CONFIG = ["./config.json", "/etc/unpackage-lite/config.json"].reduce((prevValue, currentValue) => {
    if(existsSync(path.resolve(currentValue))) {
        return { ...prevValue, ...(readJSONSync(path.resolve(currentValue), {throws: false}) || {})};
    }
    return prevValue;
}, {});

// express application
const application = express();

// start server
const server = application.listen(3000, () => {
    console.log('Server started')
});

/**
 * Check if version for a package exists, if no version is defined the latest version of the package gets returned
 * 
 * @param name name of the package
 * @param version version
 */
const checkPackageExists = async (name:string, version?:string): Promise<string> => new Promise(async (resolve, reject) => {
    try {
        if(version && existsSync(path.resolve(CACHE, name, version))) { // check if version already in cache
            resolve(version);
            return;
        }
        const headers = {};
        if('token' in CONFIG) {
            headers['Authorization'] = `Bearer ${CONFIG.token}`;
        } else if('username' in CONFIG && 'password' in CONFIG) {
            headers['Auhtorization'] = `Basic ${Buffer.from(`${CONFIG.username}:${CONFIG.password}`).toString('base64')}`
        }
        const response = await fetch(`${CONFIG.url || API}/${name}`, { headers }); // get package informatiojn
        const responseBody = await response.json();
        version = version || responseBody['dist-tags']['latest']; // if no version set, set it to latest
        if(version in responseBody['versions']) {
            if(existsSync(path.resolve(CACHE, name, version))) { // if in cache, resolve and return version
                resolve(version);
            } else { // otherwise download, add to cache and return version
                const bin = await fetch(`${CONFIG.url || API}/${name}/-/${name}-${version}.tgz`, { headers });
                await mkdirs(path.resolve(CACHE, name, version));
                const buffer = await bin.buffer();
                const readable = new Readable();
                readable._read = () => {};
                readable.push(buffer);
                readable.push(null);
                readable.pipe( x({cwd: path.resolve(CACHE, name, version)}).on('finish', () => {
                    resolve(version);
                }) );
            }
        } else {
            reject(`Version ${version} of ${name} not found`);
        }
    } catch(e) {
        reject(e);
    }
});


// main handler
application.get('*', async (req, res) => {
    try {
        if(REQUEST_REGEX.test(req.path)) {
            let [_full, name, _2, version, _3, filePath] = Array.from(REQUEST_REGEX.exec(req.path));
            const resolvedVersion = await checkPackageExists(name, version);
            if(!version) { // if no version is set redirect to latest version
                res.redirect(`/${name}@${resolvedVersion}/${filePath ? filePath : ''}`);
            } else {
                const requestedFileOrPath = path.resolve(CACHE, name, resolvedVersion, 'package', filePath || '');
                const stat = await lstat(requestedFileOrPath);
                if(!requestedFileOrPath.startsWith(path.resolve(CACHE))) { // try to access directory outside of cache -> we don't allow that
                    res.sendStatus(403);
                } if(stat.isFile()) { // if file just output file
                    res.sendFile(requestedFileOrPath);
                } else if(stat.isDirectory()) { // if directory send dir listing
                    let files = await readdir(requestedFileOrPath);
                    files = files.map(value => { // append / to directories
                        return lstatSync(path.resolve(requestedFileOrPath, value)).isDirectory() ? `${value}/` : value;
                    });
                    res.setHeader('Content-Type', "text/html");
                    res.status(200).send(dirlist(files));
                } else {
                    res.status(404).send(`File ${filePath} not found in package ${name}`);
                }
            }
        } else {
            res.sendStatus(400);
        }
    } catch(e) {
        res.status(404).send(e);
    }
    });
// gracefully shut down
const shutdown = () => {
    server.close();
    console.log('Server stopped')
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;