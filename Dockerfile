FROM node:11-alpine

RUN mkdir -p /opt/unpackage-lite
WORKDIR /opt/unpackage-lite
ADD ./package.json ./
RUN npm install --only=prod
ADD ./server ./server

RUN mkdir /cache
VOLUME [ "/cache" ]

EXPOSE 3000

# ENTRYPOINT [ "node","--inspect-brk=0.0.0.0", "./server/app.js" ]
ENTRYPOINT [ "node", "./server/app.js" ]