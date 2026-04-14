import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL
  }

  return {
    plugins: [
      {
        name: 'local-api-content',
        configureServer(server) {
          server.middlewares.use('/api/content', async (req, res, next) => {
            try {
              const resWithHelpers = res
              if (typeof resWithHelpers.status !== 'function') {
                resWithHelpers.status = (code) => {
                  res.statusCode = code
                  return resWithHelpers
                }
              }

              if (typeof resWithHelpers.json !== 'function') {
                resWithHelpers.json = (payload) => {
                  if (!res.headersSent) {
                    res.setHeader('Content-Type', 'application/json')
                  }
                  res.end(JSON.stringify(payload))
                  return resWithHelpers
                }
              }

              const mod = await import('./api/content.js')
              await mod.default(req, resWithHelpers)
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  message: 'Local API error',
                  detail: error instanceof Error ? error.message : 'Unknown error',
                }),
              )
              next()
            }
          })
        },
      },
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': '/src',
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
