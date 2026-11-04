# ============================================
# HUSTLEHUB+ BACKEND
# ============================================

FROM node:22-alpine

# Production environment
ENV NODE_ENV=production

# Application directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source code
COPY src ./src

# Backend port
EXPOSE 3000

# Start the API
CMD ["npm", "start"]