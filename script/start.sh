#!/bin/bash

export PATH=/root/.nvm/versions/node/v12.16.2/bin:$PATH
Xvfb :99 -ac 2>/dev/null &
export DISPLAY=:99
npm start