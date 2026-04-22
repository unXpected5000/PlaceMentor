FROM node:20-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY ml/requirements.txt ./ml/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir -r ml/requirements.txt

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
ENV PYTHON_COMMAND=python3

EXPOSE 8080

CMD ["node", "backend/src/server.js"]
