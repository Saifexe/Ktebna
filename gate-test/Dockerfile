# TEMPORARY - proves the blocking SonarCloud quality gate. Not used by any build;
# deleted right after the test. `npm ci` without --ignore-scripts is a known
# SonarCloud security issue, and this file is new, so the issue is new code.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
