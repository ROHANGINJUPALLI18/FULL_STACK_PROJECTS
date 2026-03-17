
import http from "http"
import dotenv from "dotenv"
import { Server } from "socket.io"
import app from "./app.js"
import connectDB from "./config/db.js"
import {setupSocket} from "./sockets/socketServer.js"


// Load environment variables
dotenv.config()

let databaseConnected = false;


const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    
    // 1️ connect database
    if (!databaseConnected) {
      await connectDB()
      databaseConnected = true;
    }

    // 2️ create http server
    const server = http.createServer(app)

    // 3️ setup socket server
    setupSocket(server)
    
    // 4️ start server
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`)
    })

  } catch (error) {
    console.error("Server startup failed:", error)
    process.exit(1)
  }
}

startServer()