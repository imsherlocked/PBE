# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application's default port (e.g., 5000)
EXPOSE 5000

# Set environment variables (you might use Docker secrets for sensitive data)
ENV PORT=5000
ENV NODE_ENV=production

# Start the server
CMD ["nodemon", "server.js"]
