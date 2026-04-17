import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // https: true,
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 5173, // Puedes especificar un puerto fijo
    strictPort: true // Evitar cambio automático de puerto
  }
})
// import { defineConfig } from 'vite'
// import fs from 'fs'
// import path from 'path'

// export default defineConfig({
//   server: {
//     https: {
//       key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
//       cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem'))
//     },
//     host: '0.0.0.0',
//     port: 5173
//   }
// })


// import { defineConfig } from 'vite'
// import selfsigned from 'selfsigned'
// import react from '@vitejs/plugin-react'
// // Genera certificados en memoria
// const certs = selfsigned.generate([
//   { name: 'commonName', value: 'localhost' }
// ], { days: 365 })

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     https: {
//       key: certs.private,
//       cert: certs.cert
//     },
//     host: '0.0.0.0'
//   }
// })



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],

//   server: {
//      https: true,
//     host: '0.0.0.0', // Escuchar en todas las interfaces
//     port: 5173, // Puedes especificar un puerto fijo
//     strictPort: true // Evitar cambio automático de puerto
//   }
// })