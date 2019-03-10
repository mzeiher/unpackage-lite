# unpackage-lite
lightweight implementation of unpkg for self hosting

# Building
just run `npm run build`
to test run `npm run test`

# Config
the config file hierarchy is `/etc/unpackage-lite/config.json` < `./config.json`
```JSON
{
    "username" : "", // username for basic auth
    "password" : "", // password for basic auth
    "token" : "", // bearer token (if set, username/password is ignored)
    "url": "" // url of your registry
}
```
# Starting
## Standalone
run `node ./server/app.js`
## Docker
To build your own docker image you can just clone the `Dockerfile`, tcp port `3000` is exposed and you can mount the volume `/cache` to presist the cache. The config file can be included by adding a `/etc/unpackage-light` volume with the `config.json` inside
## HTTPS
if you want to run the service as https use a reverse proxy with `nginx` or `apache2`