import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep track of active SSE connections for mock webhook broadcasts
interface SseClient {
  id: number
  res: any
}

let sseClients: SseClient[] = []
let nextClientId = 0

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-payment-sse-plugin',
      configureServer(server) {
        server.middlewares.use((req: any, res: any, next: any) => {
          const url = req.url ? new URL(req.url, 'http://localhost:5173') : null
          
          if (req.method === 'POST' && url?.pathname === '/mock/webhook/payment') {
            let body = ''
            req.on('data', (chunk: any) => (body += chunk))
            req.on('end', () => {
              try {
                const payload = JSON.parse(body)
                console.log('[DevServer] Received mock payment webhook:', payload)
                
                // Broadcast to all active browser EventSource connections
                sseClients.forEach((client) => {
                  client.res.write(`event: payment_received\ndata: ${JSON.stringify(payload)}\n\n`)
                })
                
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ ok: true, clientsNotified: sseClients.length }))
              } catch (err: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Invalid JSON body', details: err.message }))
              }
            })
            return
          }
          
          if (req.method === 'GET' && url?.pathname === '/events/payments') {
            // SSE subscription endpoint
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            })
            
            const clientId = ++nextClientId
            const newClient: SseClient = { id: clientId, res }
            sseClients.push(newClient)
            console.log(`[DevServer] SSE Client #${clientId} connected. Total: ${sseClients.length}`)
            
            // Send initial ping to establish connection
            res.write(':ok\n\n')
            
            // Keep connection alive by writing dummy data periodically
            const keepAlive = setInterval(() => {
              res.write(':ping\n\n')
            }, 15000)
            
            req.on('close', () => {
              clearInterval(keepAlive)
              sseClients = sseClients.filter((c) => c.id !== clientId)
              console.log(`[DevServer] SSE Client #${clientId} disconnected. Total: ${sseClients.length}`)
            })
            return
          }
          
          next()
        })
      }
    }
  ],
  server: {
    port: 5173,
  },
})
