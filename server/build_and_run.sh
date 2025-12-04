#!/bin/bash

echo "Building Docker Image..."
docker-compose build

echo "Starting Services..."
docker-compose up -d

echo "Done! Server running at http://localhost:8080"
