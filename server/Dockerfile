# Stage 1: Build Web Frontend
FROM node:20-alpine AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ .
RUN npm run build

# Stage 2: Build Go Server
FROM golang:1.24-alpine AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy built web assets to where main.go expects them
COPY --from=web-builder /app/web/dist ./web/dist
RUN go build -o lingolift-server main.go

# Stage 3: Final Image
FROM alpine:latest
WORKDIR /root/
COPY --from=go-builder /app/lingolift-server .
# Create uploads directory
RUN mkdir uploads
EXPOSE 8080
CMD ["./lingolift-server"]
