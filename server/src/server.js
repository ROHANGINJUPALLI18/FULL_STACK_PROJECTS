import http from "http"
import dotenv from "dotenv"
import { Server } from "socket.io"
import app from "./app.js"
import connectDB from "./config/db.js"


// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    
    // 1️ connect database
    await connectDB()
    console.log(" Database connected")

    // 2️ create http server
    const server = http.createServer(app)

    // 3️ attach socket
    const io = new Server(server, {
      cors: {
        origin: "*"
      }
    })

    //  handle socket connections
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })

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